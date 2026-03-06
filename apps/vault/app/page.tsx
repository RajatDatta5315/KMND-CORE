'use client';
import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Send, RefreshCw, Lock, PiggyBank, BarChart3 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_KMND_API || '';

// ── SIMPLE AUTH (no Clerk, no CORS issues) ────────────────────────────────
function useKMNDAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const t = sessionStorage.getItem('kmnd_token');
    const u = sessionStorage.getItem('kmnd_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    const r = await fetch(`${API}/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password,display_name:name}) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    sessionStorage.setItem('kmnd_token', d.token);
    sessionStorage.setItem('kmnd_user', JSON.stringify(d.user));
    setToken(d.token); setUser(d.user);
    return d;
  };

  const signin = async (email: string, password: string) => {
    const r = await fetch(`${API}/auth/signin`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    sessionStorage.setItem('kmnd_token', d.token);
    sessionStorage.setItem('kmnd_user', JSON.stringify(d.user));
    setToken(d.token); setUser(d.user);
    return d;
  };

  const signout = () => {
    sessionStorage.removeItem('kmnd_token'); sessionStorage.removeItem('kmnd_user');
    setToken(''); setUser(null);
  };

  const headers = () => ({ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' });
  return { user, token, signup, signin, signout, headers, isSignedIn: !!user };
}

export default function KMNDPage() {
  const auth = useKMNDAuth();
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [authMsg, setAuthMsg] = useState(''); const [authLoading, setAuthLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [price, setPriceData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [savings, setSavings] = useState<any>(null);
  const [fds, setFds] = useState<any[]>([]);
  const [tab, setTab] = useState<'wallet'|'send'|'savings'|'leaderboard'>('wallet');
  const [sendTo, setSendTo] = useState(''); const [sendAmt, setSendAmt] = useState(''); const [sendMsg, setSendMsg] = useState('');
  const [fdAmt, setFdAmt] = useState(''); const [fdDays, setFdDays] = useState('90'); const [fdMsg, setFdMsg] = useState('');

  const fetchAll = async () => {
    if (!auth.isSignedIn || !API) return;
    try {
      const h = auth.headers();
      const [wR, tR, sR, fR, pR, phR, lR] = await Promise.all([
        fetch(`${API}/wallet`, {headers:h}),
        fetch(`${API}/transactions?limit=25`, {headers:h}),
        fetch(`${API}/savings`, {headers:h}),
        fetch(`${API}/savings/fds`, {headers:h}),
        fetch(`${API}/price`),
        fetch(`${API}/price/history`),
        fetch(`${API}/leaderboard`),
      ]);
      const [w,t,s,f,p,ph,l] = await Promise.all([wR.json(),tR.json(),sR.json(),fR.json(),pR.json(),phR.json(),lR.json()]);
      if (w?.balance!==undefined) setWallet(w);
      if (Array.isArray(t)) setTxns(t); else if (t?.transactions) setTxns(t.transactions);
      if (s?.balance!==undefined) setSavings(s);
      if (Array.isArray(f)) setFds(f); else if (f?.fds) setFds(f.fds);
      if (p?.price!==undefined) setPriceData(p);
      if (ph?.history) setPriceHistory(ph.history);
      if (l?.leaders) setLeaderboard(l.leaders);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAll(); }, [auth.isSignedIn]);

  const handleAuth = async () => {
    if (!email || !password) return setAuthMsg('Fill in all fields');
    if (!API) return setAuthMsg('Worker URL not configured (add NEXT_PUBLIC_KMND_API to Vercel)');
    setAuthLoading(true); setAuthMsg('');
    try {
      if (authMode === 'signup') await auth.signup(email, password, name);
      else await auth.signin(email, password);
    } catch(e: any) { setAuthMsg(`❌ ${e.message}`); }
    setAuthLoading(false);
  };

  const handleSend = async () => {
    if (!sendTo||!sendAmt) return setSendMsg('Fill recipient and amount');
    try {
      const r = await fetch(`${API}/send`, {method:'POST',headers:auth.headers(),body:JSON.stringify({to_user_id:sendTo,amount:parseFloat(sendAmt),note:'Transfer'})});
      const d = await r.json();
      setSendMsg(d.ok?'✅ Sent!':` ❌ ${d.error}`);
      if (d.ok) { setSendTo(''); setSendAmt(''); fetchAll(); }
    } catch { setSendMsg('❌ Network error'); }
  };

  const createFD = async () => {
    if (!fdAmt) return setFdMsg('Enter amount');
    try {
      const r = await fetch(`${API}/savings/fd`,{method:'POST',headers:auth.headers(),body:JSON.stringify({amount:parseFloat(fdAmt),days:parseInt(fdDays)})});
      const d = await r.json();
      setFdMsg(d.ok?`✅ FD created! Matures: ⟁${d.maturity_amount?.toFixed(2)} on ${new Date(d.matures_on).toLocaleDateString()}`:`❌ ${d.error}`);
      if (d.ok) { setFdAmt(''); fetchAll(); }
    } catch { setFdMsg('❌ Network error'); }
  };

  // Price chart
  const PriceChart = () => {
    if (!priceHistory.length) return null;
    const prices = priceHistory.map((p:any) => p.price);
    const mn = Math.min(...prices)*0.99, mx = Math.max(...prices)*1.01;
    const isUp = prices[prices.length-1] >= prices[0];
    const W=400,H=60,pad=4;
    const pts = prices.map((p,i)=>`${pad+(i/Math.max(prices.length-1,1))*(W-pad*2)},${H-pad-((p-mn)/(mx-mn||0.001))*(H-pad*2)}`).join(' ');
    const color = isUp?'#22c55e':'#ef4444';
    return <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={`${pad},${H} ${pts} ${W-pad},${H}`} fill="url(#g)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>;
  };

  // ── NOT SIGNED IN ──────────────────────────────────────────────────────────
  if (!auth.isSignedIn) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4"
      style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto">
            <span className="text-2xl font-black text-cyan-400">⟁</span>
          </div>
          <h1 className="font-mono font-black text-2xl text-white">KMND Wallet</h1>
          <p className="font-mono text-[10px] text-gray-600">KryvMind Currency · New wallets start at ⟁0</p>
        </div>

        <div className="bg-[#07041A] border border-white/6 rounded-2xl p-5 space-y-3">
          <div className="flex gap-1 p-1 bg-black/40 rounded-xl">
            {(['signin','signup'] as const).map(m=>(
              <button key={m} onClick={()=>{setAuthMode(m);setAuthMsg('');}} className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${authMode===m?'bg-cyan-400/10 text-cyan-400':'text-gray-600'}`}>
                {m==='signin'?'Sign In':'Create Account'}
              </button>
            ))}
          </div>
          {authMode==='signup' && <input className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-400/40" placeholder="Display name" value={name} onChange={e=>setName(e.target.value)}/>}
          <input className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-400/40" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-400/40" type="password" placeholder="Password (6+ chars)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}/>
          {authMsg && <p className={`font-mono text-[10px] ${authMsg.startsWith('❌')?'text-red-400':'text-cyan-400'}`}>{authMsg}</p>}
          <button onClick={handleAuth} disabled={authLoading}
            className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 transition-all disabled:opacity-40">
            {authLoading?'...':(authMode==='signin'?'Sign In':'Create Account — Start at ⟁0')}
          </button>
          {!API && <p className="font-mono text-[9px] text-amber-600 text-center">Set NEXT_PUBLIC_KMND_API in Vercel to connect wallet</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[['⚔️','Battle wins','ARENAIX → +KMND'],['🛒','Sell agents','KRIYEX → +KMND'],['💰','Fixed deposits','Lock & earn interest'],['📈','KRYVX stocks','Invest in agents']].map(([ico,t,d])=>(
            <div key={t} className="bg-[#07041A] border border-white/5 rounded-xl p-3"><span className="text-base">{ico}</span><p className="font-mono text-[9px] text-white font-bold mt-1">{t}</p><p className="font-mono text-[8px] text-gray-600">{d}</p></div>
          ))}
        </div>
      </div>
    </div>
  );

  const bal = wallet?.balance ?? 0;

  // ── SIGNED IN ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black" style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Wallet card */}
        <div className="bg-[#07041A] border border-cyan-400/15 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xl text-cyan-400 font-black">⟁</div>
              <div>
                <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">KMND Wallet</p>
                <p className="font-mono text-xs text-gray-500">{auth.user?.display_name||auth.user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchAll} className="p-2 rounded-xl border border-white/8 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5 text-gray-500"/></button>
              <button onClick={auth.signout} className="px-3 py-1.5 rounded-xl border border-white/8 text-gray-600 font-mono text-[10px] hover:text-white hover:border-white/20">Sign out</button>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">Balance</p>
            <p className="font-mono font-black text-4xl text-white tabular-nums">⟁ {bal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
          </div>

          {price && (
            <div className="flex items-center gap-4 pt-3 border-t border-white/5">
              <div><p className="font-mono text-[9px] text-gray-700">KMND PRICE</p><p className="font-mono text-sm font-bold text-white">${price.price?.toFixed(6)}</p></div>
              <div className="flex-1"><PriceChart/></div>
            </div>
          )}

          {savings && (
            <div className="flex gap-3 pt-3 border-t border-white/5">
              <div className="flex-1 bg-black/30 rounded-xl p-3 space-y-1">
                <p className="font-mono text-[9px] text-gray-600">Savings Balance</p>
                <p className="font-mono text-sm font-bold text-cyan-400">⟁{savings.balance?.toFixed(2)||'0.00'}</p>
                <p className="font-mono text-[8px] text-gray-700">+{savings.interest_earned?.toFixed(4)||'0'} interest</p>
              </div>
              <div className="flex-1 bg-black/30 rounded-xl p-3 space-y-1">
                <p className="font-mono text-[9px] text-gray-600">Total Earned</p>
                <p className="font-mono text-sm font-bold text-[#22c55e]">⟁{wallet?.total_earned?.toFixed(2)||'0.00'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#07041A] border border-white/5 rounded-xl">
          {([['wallet','Transactions'],['send','Send ⟁'],['savings','Savings & FD'],['leaderboard','Rankings']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${tab===t?'bg-cyan-400/10 text-cyan-400':'text-gray-600 hover:text-gray-400'}`}>{l}</button>
          ))}
        </div>

        {/* Transactions */}
        {tab==='wallet' && <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5"><p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Transaction History</p></div>
          {!txns.length ? <div className="py-16 text-center"><p className="font-mono text-xs text-gray-700">No transactions yet</p><p className="font-mono text-[9px] text-gray-800 mt-1">Win battles, sell agents, or receive from others</p></div> :
            <div className="divide-y divide-white/4">{txns.map((tx:any)=>{
              const isIn = ['earn','receive','deposit','interest'].includes(tx.type);
              return <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isIn?'border-[#22c55e]/20 bg-[#22c55e]/5':'border-red-500/20 bg-red-500/5'}`}>
                  {isIn?<ArrowDownLeft className="h-3.5 w-3.5 text-[#22c55e]"/>:<ArrowUpRight className="h-3.5 w-3.5 text-red-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-white capitalize">{tx.description||tx.type}</p>
                  <p className="font-mono text-[9px] text-gray-600">{tx.source} · {new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <p className={`font-mono text-sm font-bold tabular-nums ${isIn?'text-[#22c55e]':'text-red-400'}`}>{isIn?'+':'-'}⟁{Math.abs(tx.amount).toFixed(2)}</p>
              </div>;
            })}</div>}
        </div>}

        {/* Send */}
        {tab==='send' && <div className="bg-[#07041A] border border-white/5 rounded-2xl p-6 space-y-4">
          <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Send KMND to Another Wallet</p>
          <input className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-400/40" placeholder="Recipient user ID" value={sendTo} onChange={e=>setSendTo(e.target.value)}/>
          <input className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-400/40" type="number" placeholder="Amount (KMND)" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1">
            <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-600">You send</span><span className="text-white">⟁{sendAmt||'0'}</span></div>
            <div className="flex justify-between font-mono text-[10px]"><span className="text-gray-600">Balance after</span><span className="text-white">⟁{Math.max(0,bal-(parseFloat(sendAmt)||0)).toFixed(2)}</span></div>
          </div>
          <button onClick={handleSend} disabled={!sendTo||!sendAmt}
            className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            <Send className="h-3.5 w-3.5"/> Send ⟁ KMND
          </button>
          {sendMsg && <p className={`font-mono text-[10px] text-center ${sendMsg.startsWith('✅')?'text-[#22c55e]':'text-red-400'}`}>{sendMsg}</p>}
        </div>}

        {/* Savings & FD */}
        {tab==='savings' && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#07041A] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-cyan-400"/><p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Savings Account</p></div>
              <p className="font-mono text-2xl font-black text-white">⟁{savings?.balance?.toFixed(2)||'0.00'}</p>
              <p className="font-mono text-[9px] text-[#22c55e]">8.5% p.a. auto-compounding</p>
              <p className="font-mono text-[9px] text-gray-700">Interest earned: ⟁{savings?.interest_earned?.toFixed(4)||'0'}</p>
              <div className="flex gap-2">
                <input className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400/40 text-xs" type="number" placeholder="Amount" id="savingsAmt"/>
                <button onClick={async()=>{
                  const a=(document.getElementById('savingsAmt') as HTMLInputElement)?.value;
                  if(!a)return;
                  const r=await fetch(`${API}/savings/deposit`,{method:'POST',headers:auth.headers(),body:JSON.stringify({amount:parseFloat(a)})});
                  const d=await r.json();if(d.ok)fetchAll();
                }} className="px-3 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono text-xs font-bold">Deposit</button>
              </div>
            </div>

            <div className="bg-[#07041A] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-indigo-400"/><p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Fixed Deposit</p></div>
              <select className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 font-mono text-xs text-white outline-none" value={fdDays} onChange={e=>setFdDays(e.target.value)}>
                <option value="30">30 days — 8.5% p.a.</option>
                <option value="90">90 days — 10% p.a.</option>
                <option value="180">180 days — 12% p.a.</option>
                <option value="365">1 year — 14% p.a.</option>
                <option value="730">2 years — 16% p.a.</option>
              </select>
              <input className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 font-mono text-xs text-white outline-none focus:border-indigo-400/40" type="number" placeholder="Amount (min ⟁100)" value={fdAmt} onChange={e=>setFdAmt(e.target.value)}/>
              {fdAmt && (() => {
                const RATES:any={30:8.5,90:10,180:12,365:14,730:16};
                const r=RATES[fdDays]||10;const a=parseFloat(fdAmt)||0;const d=parseInt(fdDays);
                const interest=a*(r/100)*(d/365);
                return <p className="font-mono text-[9px] text-indigo-400">Maturity: ⟁{(a+interest).toFixed(2)} (+⟁{interest.toFixed(2)})</p>;
              })()}
              <button onClick={createFD} className="w-full py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold hover:bg-indigo-500/20 transition-all">Create FD</button>
              {fdMsg && <p className={`font-mono text-[9px] ${fdMsg.startsWith('✅')?'text-[#22c55e]':'text-red-400'}`}>{fdMsg}</p>}
            </div>
          </div>

          {fds.length > 0 && <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5"><p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Active Fixed Deposits</p></div>
            <div className="divide-y divide-white/4">{fds.map((fd:any)=>(
              <div key={fd.id} className="flex items-center gap-4 px-5 py-3.5">
                <Lock className="h-3.5 w-3.5 text-indigo-400"/>
                <div className="flex-1"><p className="font-mono text-xs text-white">⟁{fd.principal} locked · {fd.rate_pct}% p.a.</p><p className="font-mono text-[9px] text-gray-600">Matures {new Date(fd.maturity_date).toLocaleDateString()}</p></div>
                <p className="font-mono text-xs text-[#22c55e]">⟁{fd.maturity_amount?.toFixed(2)}</p>
              </div>
            ))}</div>
          </div>}
        </div>}

        {/* Leaderboard */}
        {tab==='leaderboard' && <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5"><p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Top KMND Holders</p></div>
          {!leaderboard.length ? <div className="py-12 text-center font-mono text-xs text-gray-700">No holders yet</div> :
            <div className="divide-y divide-white/4">{leaderboard.map((h:any,i:number)=>(
              <div key={h.user_id||i} className="flex items-center gap-4 px-5 py-3.5">
                <span className="font-mono text-sm w-6">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}</span>
                <p className="flex-1 font-mono text-xs text-white">{h.display_name||'Anonymous'}</p>
                <p className="font-mono text-sm font-bold text-cyan-400 tabular-nums">⟁{(h.balance||0).toFixed(2)}</p>
              </div>
            ))}</div>}
        </div>}
      </div>
    </div>
  );
}
