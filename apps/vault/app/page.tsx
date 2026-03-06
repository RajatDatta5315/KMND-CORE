'use client';
import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Send, RefreshCw, PiggyBank, Lock, BarChart2, Coins } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_KMND_API || '';
const KRYVX = process.env.NEXT_PUBLIC_KRYVX_API || '';

// Real gold price from Yahoo Finance (free, no key needed)
async function fetchGoldPrice(): Promise<{price:number;change:number}> {
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d');
    const d = await r.json();
    const meta = d.chart?.result?.[0]?.meta;
    if (meta) return { price: meta.regularMarketPrice, change: ((meta.regularMarketPrice - meta.chartPreviousClose)/meta.chartPreviousClose*100) };
  } catch {}
  return { price: 2847.30, change: 0.42 }; // Fallback
}

type Tab = 'overview'|'transactions'|'savings'|'assets'|'send';

export default function KMNDPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [tab, setTab] = useState<Tab>('overview');
  const [wallet, setWallet]   = useState<any>(null);
  const [txns, setTxns]       = useState<any[]>([]);
  const [savings, setSavings] = useState<any>(null);
  const [fds, setFds]         = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [goldPrice, setGold]  = useState({ price: 2847.30, change: 0.42 });
  const [kmndRate]             = useState(0.001); // 1 KMND = $0.001
  const [loading, setLoading] = useState(false);
  // Send form
  const [sendTo, setSendTo]   = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  // Savings form
  const [saveAmt, setSaveAmt]   = useState('');
  const [fdAmt, setFdAmt]       = useState('');
  const [fdDays, setFdDays]     = useState(30);
  const [actionMsg, setActionMsg] = useState('');

  const auth = async() => {
    try { return await (user as any).getToken?.() || ''; } catch { return ''; }
  };

  const load = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    const [g] = await Promise.all([fetchGoldPrice()]);
    setGold(g);
    if (!API) { setLoading(false); return; }
    try {
      const token = await auth();
      const headers = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' };
      const [wR,tR,sR] = await Promise.all([
        fetch(`${API}/wallet`,{headers}),
        fetch(`${API}/transactions?limit=30`,{headers}),
        fetch(`${API}/savings`,{headers}),
      ]);
      const [w,t,s] = await Promise.all([wR.json(),tR.json(),sR.json()]);
      if(w.balance!==undefined) setWallet(w);
      if(Array.isArray(t)) setTxns(t);
      if(s.balance!==undefined) setSavings(s);
      if(Array.isArray(s.fds)) setFds(s.fds);
    } catch {}
    // Load holdings from KRYVX
    if (KRYVX) {
      try {
        const token = await auth();
        const r = await fetch(`${KRYVX}/portfolio`,{headers:{Authorization:`Bearer ${token}`}});
        const d = await r.json();
        if(d.agent_holdings) setHoldings([...(d.agent_holdings||[]),...(d.asset_holdings||[])]);
      } catch {}
    }
    setLoading(false);
  };

  useEffect(()=>{ if(isSignedIn) load(); },[isSignedIn]);
  useEffect(()=>{ const t=setInterval(()=>fetchGoldPrice().then(setGold),60000); return()=>clearInterval(t); },[]);

  const doSend = async() => {
    if(!sendTo||!sendAmt) return setSendMsg('Fill all fields');
    if(!API) return setSendMsg('Deploy Worker first');
    const token=await auth();
    const r=await fetch(`${API}/send`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({to_user_id:sendTo,amount:parseFloat(sendAmt)})});
    const d=await r.json();
    setSendMsg(d.ok?`✅ Sent ⟁${sendAmt} successfully`:`❌ ${d.error}`);
    if(d.ok){setSendTo('');setSendAmt('');load();}
  };

  const doSaveDeposit = async() => {
    if(!API||!saveAmt) return;
    const token=await auth();
    const r=await fetch(`${API}/savings/deposit`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({amount:parseFloat(saveAmt)})});
    const d=await r.json();
    setActionMsg(d.ok?`✅ Deposited ⟁${saveAmt} to savings (8.5% p.a.)`:`❌ ${d.error}`);
    if(d.ok){setSaveAmt('');load();}
  };

  const doFD = async() => {
    if(!API||!fdAmt) return;
    const token=await auth();
    const r=await fetch(`${API}/savings/fd`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({amount:parseFloat(fdAmt),days:fdDays})});
    const d=await r.json();
    const rates: Record<number,string>={30:'9%',90:'10.5%',180:'12%',365:'14%'};
    setActionMsg(d.ok?`✅ FD created: ⟁${fdAmt} locked for ${fdDays}d at ${rates[fdDays]}`:`❌ ${d.error}`);
    if(d.ok){setFdAmt('');load();}
  };

  if(!isLoaded) return <div className="min-h-screen bg-[#03020A] flex items-center justify-center"><div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"/></div>;

  if(!isSignedIn) return (
    <div className="min-h-screen bg-[#03020A] flex items-center justify-center px-4" style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.025) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto text-2xl font-black text-cyan-400">⟁</div>
          <h1 className="font-mono font-black text-2xl text-white">KMND Wallet</h1>
          <p className="font-mono text-[11px] text-gray-600">KryvMind Currency · Universal payment across KRYV ecosystem</p>
        </div>
        <div className="bg-[#07041A] border border-white/6 rounded-2xl p-6 space-y-4">
          <p className="font-mono text-[10px] text-gray-600 text-center uppercase tracking-widest">New wallets start at ⟁ 0.00 KMND</p>
          <SignInButton mode="modal"><button className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 transition-all">Sign In</button></SignInButton>
          <SignUpButton mode="modal"><button className="w-full py-3 rounded-xl bg-white/3 border border-white/8 text-gray-300 font-mono text-sm hover:bg-white/6 transition-all">Create Account → Start at ⟁0</button></SignUpButton>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{i:'⚔️',l:'Battle & Win',d:'ARENAIX wins → KMND'},{i:'🛒',l:'Sell Agents',d:'KRIYEX sales → KMND'},{i:'📈',l:'Trade KRYVX',d:'Buy agent stocks'},{i:'💰',l:'Savings 8.5%',d:'Daily compound interest'}].map(({i,l,d})=>(
            <div key={l} className="bg-[#07041A] border border-white/5 rounded-xl p-3"><span className="text-lg">{i}</span><p className="font-mono text-[10px] text-white font-bold mt-1">{l}</p><p className="font-mono text-[9px] text-gray-600">{d}</p></div>
          ))}
        </div>
      </div>
    </div>
  );

  const bal = wallet?.balance ?? 0;
  const goldKmnd = goldPrice.price / kmndRate; // 1 gram gold in KMND

  const TABS: {id:Tab;label:string;icon:any}[] = [
    {id:'overview',label:'Overview',icon:Wallet},
    {id:'transactions',label:'History',icon:ArrowDownLeft},
    {id:'savings',label:'Savings & FD',icon:PiggyBank},
    {id:'assets',label:'Assets',icon:BarChart2},
    {id:'send',label:'Send ⟁',icon:Send},
  ];

  return (
    <div className="min-h-screen bg-[#03020A]" style={{backgroundImage:'linear-gradient(rgba(0,210,220,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,220,0.025) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* Wallet card */}
        <div className="bg-[#07041A] border border-cyan-400/15 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-lg font-black text-cyan-400">⟁</div>
              <div>
                <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">KMND Wallet</p>
                <p className="font-mono text-xs text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className={`p-2 rounded-xl border border-white/8 hover:bg-white/5 ${loading?'animate-spin':''}`}><RefreshCw className="h-3.5 w-3.5 text-gray-500"/></button>
              <UserButton afterSignOutUrl="/"/>
            </div>
          </div>
          <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-1">Balance</p>
          <p className="font-mono font-black text-5xl text-white tabular-nums mb-1">⟁ {bal.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
          <p className="font-mono text-[10px] text-gray-600">≈ ${(bal*kmndRate).toFixed(4)} USD · ₹{(bal*kmndRate*83.5).toFixed(2)} INR</p>
          {!API&&<p className="font-mono text-[9px] text-yellow-600 mt-2">⚠️ Add NEXT_PUBLIC_KMND_API to Vercel to connect real wallet</p>}

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              {l:'Savings',v:savings?`⟁${(savings.balance||0).toFixed(2)}`:'⟁0.00',sub:'8.5% p.a.',color:'text-green-400'},
              {l:'Active FDs',v:fds.filter(f=>f.status==='active').length,sub:`${fds.length} total`,color:'text-amber-400'},
              {l:'Investments',v:holdings.length?`${holdings.length} positions`:'None',sub:'KRYVX portfolio',color:'text-violet-400'},
            ].map(({l,v,sub,color})=>(
              <div key={l} className="bg-black/30 border border-white/5 rounded-xl p-3">
                <p className="font-mono text-[9px] text-gray-700 uppercase">{l}</p>
                <p className={`font-mono text-sm font-bold ${color}`}>{v}</p>
                <p className="font-mono text-[9px] text-gray-700">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#07041A] border border-white/5 rounded-xl overflow-x-auto">
          {TABS.map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest font-bold transition-all ${tab===id?'bg-cyan-400/10 text-cyan-400':'text-gray-600 hover:text-gray-400'}`}>
              <Icon className="h-3 w-3"/>{label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab==='overview'&&(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kryv Gold tracker */}
            <div className="bg-[#07041A] border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-xl">🥇</span><p className="font-mono font-bold text-sm text-white">Kryv Gold</p></div>
                <span className={`font-mono text-xs font-bold flex items-center gap-1 ${goldPrice.change>=0?'text-green-400':'text-red-400'}`}>
                  {goldPrice.change>=0?<TrendingUp className="h-3 w-3"/>:<TrendingDown className="h-3 w-3"/>}
                  {goldPrice.change>=0?'+':''}{goldPrice.change.toFixed(2)}%
                </span>
              </div>
              <div>
                <p className="font-mono text-[9px] text-gray-600">Real-time Gold Price (per troy oz)</p>
                <p className="font-mono font-black text-2xl text-white">${goldPrice.price.toFixed(2)}</p>
                <p className="font-mono text-[10px] text-amber-400">= ⟁{goldKmnd.toLocaleString('en',{maximumFractionDigits:0})} KMND per oz</p>
              </div>
              <a href="https://kryvx.kryv.network" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold hover:bg-amber-500/20 transition-all">
                Trade Kryv Gold on KRYVX →
              </a>
            </div>

            {/* Ecosystem links */}
            <div className="bg-[#07041A] border border-white/5 rounded-2xl p-5 space-y-3">
              <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Earn KMND</p>
              {[
                {icon:'⚔️',name:'Win on ARENAIX',action:'Battle → win → earn KMND',href:'https://arenaix.kryv.network',color:'text-purple-400'},
                {icon:'🛒',name:'Sell on KRIYEX',action:'Agent sale → instant KMND',href:'https://kriyex.kryv.network',color:'text-cyan-400'},
                {icon:'📈',name:'Trade on KRYVX',action:'Sell stocks → profit to wallet',href:'https://kryvx.kryv.network',color:'text-green-400'},
              ].map(({icon,name,action,href,color})=>(
                <a key={name} href={href} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1"><p className={`font-mono text-xs font-bold ${color}`}>{name}</p><p className="font-mono text-[9px] text-gray-600">{action}</p></div>
                  <ArrowUpRight className="h-3 w-3 text-gray-700"/>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        {tab==='transactions'&&(
          <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5"><p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Transaction History</p></div>
            {txns.length===0?(
              <div className="py-16 text-center space-y-2"><p className="font-mono text-xs text-gray-700">No transactions yet</p><p className="font-mono text-[9px] text-gray-800">Win battles, sell agents, or receive KMND to see history</p></div>
            ):(
              <div className="divide-y divide-white/4">
                {txns.map((tx:any)=>{
                  const isIn=tx.type==='earn'||tx.type==='receive'||tx.type==='interest';
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${isIn?'border-green-500/20 bg-green-500/5':'border-red-500/20 bg-red-500/5'}`}>
                        {isIn?<ArrowDownLeft className="h-3.5 w-3.5 text-green-400"/>:<ArrowUpRight className="h-3.5 w-3.5 text-red-400"/>}
                      </div>
                      <div className="flex-1 min-w-0"><p className="font-mono text-xs text-white capitalize">{tx.description||tx.type}</p><p className="font-mono text-[9px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()} · {tx.source||'system'}</p></div>
                      <p className={`font-mono text-sm font-bold tabular-nums flex-shrink-0 ${isIn?'text-green-400':'text-red-400'}`}>{isIn?'+':'-'}⟁{Math.abs(tx.amount).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Savings & FD */}
        {tab==='savings'&&(
          <div className="space-y-4">
            {/* Savings account */}
            <div className="bg-[#07041A] border border-green-500/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-green-400"/><p className="font-mono font-bold text-sm text-white">Savings Account</p><span className="font-mono text-[9px] text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-0.5 rounded-full">8.5% p.a.</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{l:'Balance',v:`⟁${savings?(savings.balance||0).toFixed(2):'0.00'}`,color:'text-green-400'},{l:'Interest Earned',v:`⟁${savings?(savings.interest_earned||0).toFixed(4):'0.0000'}`,color:'text-cyan-400'},{l:'Deposited',v:`⟁${savings?(savings.total_deposited||0).toFixed(2):'0.00'}`,color:'text-white'}].map(({l,v,color})=>(
                  <div key={l} className="bg-black/30 rounded-xl p-3 border border-white/5"><p className="font-mono text-[9px] text-gray-700">{l}</p><p className={`font-mono text-sm font-bold ${color}`}>{v}</p></div>
                ))}
              </div>
              <p className="font-mono text-[9px] text-gray-600">Interest compounded daily. Withdraw anytime, no penalty.</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount to deposit" value={saveAmt} onChange={e=>setSaveAmt(e.target.value)} className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-green-400/40 placeholder:text-gray-700"/>
                <button onClick={doSaveDeposit} disabled={!saveAmt||!API} className="px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-xs font-bold rounded-xl hover:bg-green-500/20 disabled:opacity-40">Deposit</button>
              </div>
              {actionMsg&&<p className={`font-mono text-[10px] ${actionMsg.startsWith('✅')?'text-green-400':'text-red-400'}`}>{actionMsg}</p>}
            </div>

            {/* Fixed Deposits */}
            <div className="bg-[#07041A] border border-amber-500/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-amber-400"/><p className="font-mono font-bold text-sm text-white">Fixed Deposits</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[{d:30,r:'9%'},{d:90,r:'10.5%'},{d:180,r:'12%'},{d:365,r:'14%'}].map(({d,r})=>(
                  <button key={d} onClick={()=>setFdDays(d)} className={`p-3 rounded-xl border text-center transition-all ${fdDays===d?'border-amber-500/40 bg-amber-500/10':'border-white/8 hover:border-white/15'}`}>
                    <p className="font-mono text-[9px] text-gray-600">{d} days</p>
                    <p className="font-mono text-sm font-black text-amber-400">{r}</p>
                    <p className="font-mono text-[8px] text-gray-700">per year</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Min ⟁100" value={fdAmt} onChange={e=>setFdAmt(e.target.value)} className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400/40 placeholder:text-gray-700"/>
                <button onClick={doFD} disabled={!fdAmt||parseFloat(fdAmt)<100||!API} className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold rounded-xl hover:bg-amber-500/20 disabled:opacity-40">Create FD</button>
              </div>
              {fds.length>0&&(
                <div className="space-y-2">
                  {fds.map((fd:any)=>(
                    <div key={fd.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
                      <Lock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0"/>
                      <div className="flex-1"><p className="font-mono text-xs text-white">⟁{fd.principal} · {fd.days}d · {fd.rate_pct}%</p><p className="font-mono text-[9px] text-gray-600">Matures {new Date(fd.maturity_date).toLocaleDateString()} · +⟁{fd.interest_earned?.toFixed(2)}</p></div>
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${fd.status==='active'?'text-green-400 border-green-400/20 bg-green-400/5':'text-gray-500 border-gray-700'}`}>{fd.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assets */}
        {tab==='assets'&&(
          <div className="space-y-4">
            <div className="bg-[#07041A] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Your KRYVX Holdings</p>
                <a href="https://kryvx.kryv.network" className="font-mono text-[9px] text-violet-400 hover:underline">View all on KRYVX →</a>
              </div>
              {holdings.length===0?(
                <div className="py-12 text-center space-y-2">
                  <Coins className="h-8 w-8 text-gray-700 mx-auto"/>
                  <p className="font-mono text-xs text-gray-700">No investments yet</p>
                  <a href="https://kryvx.kryv.network" className="font-mono text-[9px] text-violet-400 hover:underline block">Buy agent stocks or Kryv Gold →</a>
                </div>
              ):(
                <div className="divide-y divide-white/4">
                  {holdings.map((h:any,i)=>{
                    const val=(h.shares||0)*(h.current_price||h.avg_buy_price||0);
                    const cost=(h.shares||0)*(h.avg_buy_price||0);
                    const pnl=val-cost;
                    return (
                      <div key={h.id||i} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center justify-center font-mono font-black text-sm text-violet-400">{(h.name||h.asset_key||'?')[0]}</div>
                        <div className="flex-1 min-w-0"><p className="font-mono text-xs text-white font-bold">{h.name||h.asset_key}</p><p className="font-mono text-[9px] text-gray-600">{h.shares} units · avg ⟁{(h.avg_buy_price||0).toFixed(2)}</p></div>
                        <div className="text-right"><p className="font-mono text-sm font-bold text-white tabular-nums">⟁{val.toFixed(2)}</p><p className={`font-mono text-[9px] font-bold ${pnl>=0?'text-green-400':'text-red-400'}`}>{pnl>=0?'+':''}⟁{pnl.toFixed(2)}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send */}
        {tab==='send'&&(
          <div className="bg-[#07041A] border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">Send KMND</p>
            <input className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-700 outline-none focus:border-cyan-400/40" placeholder="Recipient user ID" value={sendTo} onChange={e=>setSendTo(e.target.value)}/>
            <input type="number" className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-700 outline-none focus:border-cyan-400/40" placeholder="Amount (KMND)" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1.5">
              {[['Sending',`⟁ ${sendAmt||'0'}`],['Balance after',`⟁ ${Math.max(0,bal-(parseFloat(sendAmt)||0)).toFixed(2)}`]].map(([l,v])=>(
                <div key={l} className="flex justify-between"><span className="font-mono text-[10px] text-gray-600">{l}</span><span className="font-mono text-[10px] text-white">{v}</span></div>
              ))}
            </div>
            <button onClick={doSend} disabled={!sendTo||!sendAmt||!API} className="w-full py-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono font-bold text-sm hover:bg-cyan-400/20 disabled:opacity-40 flex items-center justify-center gap-2">
              <Send className="h-3.5 w-3.5"/> Send ⟁ KMND
            </button>
            {sendMsg&&<p className={`font-mono text-[10px] text-center ${sendMsg.startsWith('✅')?'text-green-400':'text-red-400'}`}>{sendMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
