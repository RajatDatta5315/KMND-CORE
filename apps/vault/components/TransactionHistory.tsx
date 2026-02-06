'use client';
import { useEffect, useState } from 'react';

export default function TransactionHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch from Gateway
    fetch(`https://kmnd-core.YOUR_WORKER_URL.workers.dev/history?userId=${userId}`)
      .then(res => res.json())
      .then(data => setHistory(data.transactions || []));
  }, [userId]);

  return (
    <div className="mt-10 w-full max-w-2xl border border-cyan-900/30 bg-black/50 p-6 backdrop-blur-xl">
      <h3 className="text-cyan-400 font-mono text-sm mb-4 tracking-widest uppercase">Recent_Activity // Ledger</h3>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-gray-600 font-mono text-xs italic italic">No data in neural link...</p>
        ) : (
          history.map((tx: any) => (
            <div key={tx.id} className="flex justify-between items-center border-b border-white/5 pb-2">
              <div>
                <p className="text-white text-xs font-bold uppercase">{tx.app_id}</p>
                <p className="text-[10px] text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
              </div>
              <p className={`font-mono ${tx.action_type === 'SPEND' ? 'text-red-500' : 'text-green-500'}`}>
                {tx.action_type === 'SPEND' ? '-' : '+'}⟁{tx.amount}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
