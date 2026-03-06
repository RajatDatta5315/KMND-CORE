'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const API = process.env.NEXT_PUBLIC_KMND_API || '';

type Tx = { id:string; type:string; amount:number; description:string; created_at:string; };

const DEMO_TX: Tx[] = [
  { id:'1', type:'earn', amount:100, description:'Genesis Grant — Welcome to KMND', created_at:new Date(Date.now()-86400000*7).toISOString() },
  { id:'2', type:'earn', amount:250, description:'Battle win — ORACLE (+8 ELO)', created_at:new Date(Date.now()-86400000*3).toISOString() },
  { id:'3', type:'earn', amount:50,  description:'KRIYEX marketplace sale', created_at:new Date(Date.now()-86400000).toISOString() },
];

export default function TransactionHistory() {
  const { getToken } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API) { setTxs(DEMO_TX); setLoading(false); return; }
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setTxs(Array.isArray(data) ? data : DEMO_TX);
      } catch { setTxs(DEMO_TX); }
      setLoading(false);
    })();
  }, [getToken]);

  const isDemo = !API;

  return (
    <div className="border border-white/5 bg-black/40 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest">Transaction History</h3>
        {isDemo && <span className="text-[9px] font-mono text-yellow-700 border border-yellow-700/30 px-2 py-0.5 rounded-full">DEMO</span>}
      </div>
      {loading ? (
        <div className="p-4 space-y-2">{[...Array(3)].map((_,i)=><div key={i} className="h-10 bg-white/5 rounded animate-pulse"/>)}</div>
      ) : txs.length === 0 ? (
        <p className="text-gray-600 font-mono text-xs text-center py-8">No transactions yet</p>
      ) : (
        <div className="divide-y divide-white/5">
          {txs.map(tx => (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-colors">
              <div>
                <p className="font-mono text-xs text-white">{tx.description}</p>
                <p className="font-mono text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`font-mono text-sm font-bold tabular-nums ${tx.amount>0?'text-cyan-400':'text-red-400'}`}>
                {tx.amount>0?'+':''}{tx.amount > 0 ? '⟁' : '-⟁'}{Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
