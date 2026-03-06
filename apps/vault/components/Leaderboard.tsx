'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_KMND_API || '';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API) { setLoading(false); return; }
    fetch(`${API}/leaderboard`)
      .then(r => r.json())
      .then(d => setLeaders(d.leaders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Demo data when worker not deployed
  const demo = [
    { user_id: 'user_rajat', display_name: 'ARCHITECT', balance: 12500 },
    { user_id: 'user_2',     display_name: 'CIPHER_OPS', balance: 8340 },
    { user_id: 'user_3',     display_name: 'VOID_TRADER', balance: 5120 },
    { user_id: 'user_4',     display_name: 'NODE_RUNNER', balance: 3980 },
    { user_id: 'user_5',     display_name: 'ANON', balance: 2210 },
  ];

  const data = leaders.length > 0 ? leaders : demo;
  const isDemo = leaders.length === 0;

  return (
    <div className="border border-cyan-900/20 bg-black/60 p-6 backdrop-blur-xl rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest">TOP_MINDS // RANKING</h3>
        {isDemo && <span className="text-[9px] font-mono text-yellow-700 border border-yellow-700/30 px-2 py-0.5 rounded-full">DEMO</span>}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_,i) => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {data.slice(0,10).map((l, i) => (
            <div key={l.user_id} className="flex justify-between items-center text-xs py-2.5 border-b border-white/5 font-mono group hover:bg-white/3 transition-colors px-1 rounded">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] w-5 text-center ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-amber-600':'text-gray-600'}`}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </span>
                <span className="text-gray-300">{l.display_name || `${l.user_id.slice(0,8)}...`}</span>
              </div>
              <span className="text-cyan-400 tabular-nums">⟁ {l.balance?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[9px] text-gray-700 font-mono text-center mt-4 border-t border-white/5 pt-3">
        {isDemo ? 'Deploy KMND Worker for live data' : `${data.length} holders tracked`}
      </p>
    </div>
  );
}
