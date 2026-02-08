'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("https://kmnd-core.rajat90000.workers.dev/analytics")
      .then(res => res.json())
      .then(data => setLogs(data.analytics || []));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <h1 className="text-4xl font-black mb-10 italic uppercase tracking-tighter">Neural_Revenue_Stream</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {logs.map((log: any) => (
          <div key={log.app_id} className="p-6 border border-zinc-800 bg-zinc-900/40 flex justify-between items-center group hover:border-cyan-500 transition-all">
            <div>
              <p className="text-cyan-500 font-mono text-[10px] uppercase mb-1">{log.app_id}</p>
              <h3 className="text-xl font-bold tracking-tight">Total Volume: {log.tx_count} TXs</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Tax_Collected</p>
              <p className="text-3xl font-black text-white italic">⟁{log.total_tax}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
