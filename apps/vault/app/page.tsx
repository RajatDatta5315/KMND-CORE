'use client';
import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Send, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_KMND_API || '';

function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function KMNDPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [price, setPrice] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [tab, setTab] = useState<'wallet'|'send'|'leaderboard'>('wallet');

  const fetchWallet = async () => {
    if (!isSignedIn || !API) return;
    setLoading(true);
    try {
      const token = await (user as any).getToken?.() || '';
      const [wRes, tRes, pRes, phRes, lRes] = await Promise.all([
        fetch(`${API}/wallet`, { headers: getAuthHeader(token) }),
        fetch(`${API}/transactions?limit=20`, { headers: getAuthHeader(token) }),
        fetch(`${API}/price`),
        fetch(`${API}/price/history`),
        fetch(`${API}/leaderboard`),
      ]);
      const [w, t, p, ph, l] = await Promise.all([wRes.json(), tRes.json(), pRes.json(), phRes.json(), lRes.json()]);
      if (w.balance !== undefined) setWallet(w);
      if (Array.isArray(t)) setTransactions(t);
      if (p.price !== undefined) setPrice(p);
      if (Array.isArray(ph)) setPriceHistory(ph);
      if (Array.isArray(l)) setLeaderboard(l.slice(0,10));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (isSignedIn) fetchWallet(); }, [isSignedIn]);

  const handleSend = async () => {
    if (!API || !sendTo || !sendAmt) return setSendMsg('Fill all fields');
    const token = await (user as any).getToken?.() || '';
    const res = await fetch(`${API}/send`, {
      method: 'POST', headers: getAuthHeader(token),
      body: JSON.stringify({ to_user_id: sendTo, amount: parseFloat(sendAmt), note: 'Transfer' })
    });
    const d = await res.json();
    setSendMsg(d.ok ? '✅ Sent!' : `❌ ${d.error}`);
    if (d.ok) { setSendTo(''); setSendAmt(''); fetchWallet(); }
  };

  // Price chart SVG
  const PriceChart = () => {
    if (!priceHistory.length) return null;
    const prices = priceHistory.map((p: any) => p.price);
    const min = Math.min(...prices)*0.99, max = Math.max(...prices)*1.01;
    const W = 400, H = 80, pad = 8;
    const isUp = prices[prices.length-1] >= prices[0];
    const pts = prices.map((p, i) => {
      const x = pad + (i/Math.max(prices.length-1,1))*(W-pad*2);
      const y = H - pad - ((p-min)/(max-min||0.01))*(H-pad*2);
      return `${x},${y}`;
    }).join(' ');
    const color = isUp ? '#22c55e' : '#ef4444';
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polygon points={`${pad},${H} ${pts} ${W-pad},${H}`} fill="url(#cg)"/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  };

  // NOT LOADED YET
  if (!isLoaded) return (
    <div className="min-h-screen bg-[#03020A] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"/>
    </div>
  );

  // NOT SIGNED IN — clean login/signup screen
  if (!isSignedIn) return (
    <div className="min-h-screen bg-[#03020A] flex items-center justify-center px-4" style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto">
            <span className="text-2xl font-black text-cyan-400">⟁</span>
          </div>
          <h1 className="font-mono font-black text-2xl text-white">KMND Wallet</h1>
          <p className="font-mono text-[11px] text-gray-600">KryvMind Currency · Pay anywhere in KRYV ecosystem</p>
        </div>

        <div className="bg-[#07041A] border border-white/6 rounded-2xl p-6 space-y-4">
          <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest text-center">Connect to access your wallet</p>
          <div className="space-y-3">
            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-white/3 border border-white/8 text-gray-300 font-mono font-bold text-sm hover:bg-white/6 transition-all">
                Create Account → Start with ⟁0
              </button>
            </SignUpButton>
          </div>
          <p className="font-mono text-[9px] text-gray-700 text-center">New wallets start at ⟁0 KMND · Earn by using the KRYV ecosystem</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {icon:'⚔️', label:'Battle wins', desc:'ARENAIX → +KMND'},
            {icon:'🛒', label:'Sell agents', desc:'KRIYEX → +KMND'},
            {icon:'📤', label:'Send/receive', desc:'Peer-to-peer transfers'},
            {icon:'📈', label:'Invest', desc:'KRYVX stock market'},
          ].map(({icon,label,desc})=>(
            <div key={label} className="bg-[#07041A] border border-white/5 rounded-xl p-3 space-y-1">
              <span className="text-lg">{icon}</span>
              <p className="font-mono text-[10px] text-white font-bold">{label}</p>
              <p className="font-mono text-[9px] text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // SIGNED IN
  const bal = wallet?.balance ?? 0;
  const priceChange = price ? ((price.price - (price.prev_price || price.price)) / Math.max(price.prev_price||price.price, 0.000001) * 100).toFixed(2) : '0.00';
  const priceUp = parseFloat(priceChange) >= 0;

  return (
    <div className="min-h-screen bg-[#03020A]" style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* Wallet header */}
        <div className="bg-[#07041A] border border-cyan-400/15 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                <span className="text-lg font-black text-cyan-400">⟁</span>
              </div>
              <div>
                <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">KMND Wallet</p>
                <p className="font-mono text-xs text-gray-500 truncate max-w-32">{user?.id?.slice(0,16)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchWallet} className={`p-2 rounded-xl border border-white/8 hover:bg-white/5 transition-all ${loading?'animate-spin':''}`}>
                <RefreshCw className="h-3.5 w-3.5 text-gray-500"/>
              </button>
              <UserButton afterSignOutUrl="/"/>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">Balance</p>
            <p className="font-mono font-black text-4xl text-white tabular-nums">
              ⟁ {bal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
            </p>
            {!API && <p className="font-mono text-[9px] text-yellow-600">Add NEXT_PUBLIC_KMND_API to Vercel to see real balance</p>}
          </div>

          {/* Price ticker */}
          {price && (
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-4">
              <div>
                <p className="font-mono text-[9px] text-gray-700">KMND/USD</p>
                <p className="font-mono text-sm font-bold text-white">${price.price?.toFixed(6)}</p>
              </div>
              <span className={`flex items-center gap-1 font-mono text-xs font-bold ${priceUp?'text-[#22c55e]':'text-red-400'}`}>
                {priceUp?<TrendingUp className="h-3 w-3"/>:<TrendingDown className="h-3 w-3"/>}
                {priceUp?'+':''}{priceChange}%
              </span>
              <div className="flex-1"><PriceChart/></div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#07041A] border border-white/5 rounded-xl">
          {(['wallet','send','leaderboard'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest font-bold transition-all ${tab===t?'bg-cyan-400/10 text-cyan-400':'text-gray-600 hover:text-gray-400'}`}>
              {t==='wallet'?'Transactions':t==='send'?'Send ⟁':t==='leaderboard'?'Rankings':t}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {tab==='wallet' && (
          <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Transaction History</p>
            </div>
            {transactions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-mono text-xs text-gray-700">No transactions yet</p>
                <p className="font-mono text-[9px] text-gray-800 mt-1">Win battles on ARENAIX, sell agents on KRIYEX, or receive from others</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {transactions.map((tx: any) => {
                  const isIn = tx.type === 'earn' || tx.type === 'receive';
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isIn?'border-[#22c55e]/20 bg-[#22c55e]/5':'border-red-500/20 bg-red-500/5'}`}>
                        {isIn?<ArrowDownLeft className="h-3.5 w-3.5 text-[#22c55e]"/>:<ArrowUpRight className="h-3.5 w-3.5 text-red-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-white capitalize">{tx.description || tx.type}</p>
                        <p className="font-mono text-[9px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()} · {tx.source||tx.type}</p>
                      </div>
                      <p className={`font-mono text-sm font-bold tabular-nums ${isIn?'text-[#22c55e]':'text-red-400'}`}>
                        {isIn?'+':'-'}⟁{Math.abs(tx.amount).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Send */}
        {tab==='send' && (
          <div className="bg-[#07041A] border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Send KMND</p>
            <input className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-700 outline-none focus:border-cyan-400/40"
              placeholder="Recipient user ID" value={sendTo} onChange={e=>setSendTo(e.target.value)}/>
            <input className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-700 outline-none focus:border-cyan-400/40"
              placeholder="Amount (KMND)" type="number" min="0" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1">
              <div className="flex justify-between"><span className="font-mono text-[10px] text-gray-600">Sending</span><span className="font-mono text-[10px] text-white">⟁ {sendAmt||'0'}</span></div>
              <div className="flex justify-between"><span className="font-mono text-[10px] text-gray-600">Balance after</span><span className="font-mono text-[10px] text-white">⟁ {Math.max(0,bal-(parseFloat(sendAmt)||0)).toFixed(2)}</span></div>
            </div>
            <button onClick={handleSend} disabled={!sendTo||!sendAmt||!API}
              className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Send className="h-3.5 w-3.5"/> Send ⟁ KMND
            </button>
            {sendMsg && <p className={`font-mono text-[10px] text-center ${sendMsg.startsWith('✅')?'text-[#22c55e]':'text-red-400'}`}>{sendMsg}</p>}
          </div>
        )}

        {/* Leaderboard */}
        {tab==='leaderboard' && (
          <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5"><p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Top KMND Holders</p></div>
            {leaderboard.length === 0 ? (
              <div className="py-12 text-center"><p className="font-mono text-xs text-gray-700">No holders yet — be the first to earn KMND!</p></div>
            ) : (
              <div className="divide-y divide-white/4">
                {leaderboard.map((h: any, i) => (
                  <div key={h.user_id||i} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="font-mono text-sm w-6 text-gray-600">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}</span>
                    <p className="flex-1 font-mono text-xs text-white">{h.display_name||h.user_id?.slice(0,12)||'Anonymous'}</p>
                    <p className="font-mono text-sm font-bold text-cyan-400 tabular-nums">⟁ {(h.balance||0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
