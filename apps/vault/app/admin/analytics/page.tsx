'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gateway/analytics")
      .then(res => res.json())
      .then(data => {
        setLogs(data.analytics || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-cyan-500 font-mono italic">SYNCING_ECONOMY_DATA...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <h1 className="text-4xl font-black mb-10 italic uppercase tracking-tighter">Neural_Revenue_Stream</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logs.length > 0 ? logs.map((log: any) => (
          <div key={log.app_id} className="p-6 border border-zinc-800 bg-zinc-900/40 flex justify-between items-center hover:border-cyan-500 transition-all group">
            <div>
              <p className="text-cyan-500 font-mono text-[10px] uppercase mb-1 tracking-widest">{log.app_id || "UNKNOWN_NODE"}</p>
              <h3 className="text-xl font-bold tracking-tight">{log.tx_count} Transactions</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Tax_Generated</p>
              <p className="text-3xl font-black text-white italic">⟁{log.total_tax.toFixed(2)}</p>
            </div>
          </div>
        )) : (
          <div className="col-span-2 p-10 border border-dashed border-zinc-800 text-center text-gray-500 font-mono text-xs italic">
            NO_ACTIVE_ECOSYSTEM_TRAFFIC_DETECTED
          </div>
        )}
      </div>
    </div>
  );
}
