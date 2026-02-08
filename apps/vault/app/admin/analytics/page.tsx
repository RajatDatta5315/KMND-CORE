'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalTax: 0, volume: 0 });

  useEffect(() => {
    // Fetch stats from Gateway
    fetch("https://kmnd-core.rajat.workers.dev/leaderboard")
      .then(res => res.json())
      .then(data => {
        // Logic to calculate stats from data
        const tax = data.leaders.find((u: any) => u.id === 'ADMIN_KRYV')?.balance || 0;
        setStats({ 
          totalUsers: data.leaders.length, 
          totalTax: tax,
          volume: data.leaders.reduce((a: any, b: any) => a + b.balance, 0)
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-cyan-500 p-10 font-mono">
      <h1 className="text-3xl font-black mb-10 border-b border-cyan-900 pb-4">CORE_ECONOMY_ANALYTICS</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 border border-zinc-800 bg-zinc-900/20">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-[0.3em]">Total_Tax_Collected</p>
          <h2 className="text-4xl font-bold text-white italic">⟁{stats.totalTax.toLocaleString()}</h2>
        </div>
        <div className="p-8 border border-zinc-800 bg-zinc-900/20">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-[0.3em]">Active_Neural_Nodes</p>
          <h2 className="text-4xl font-bold text-white italic">{stats.totalUsers}</h2>
        </div>
        <div className="p-8 border border-zinc-800 bg-zinc-900/20">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-[0.3em]">Ecosystem_Volume</p>
          <h2 className="text-4xl font-bold text-white italic">⟁{stats.volume.toLocaleString()}</h2>
        </div>
      </div>

      <div className="mt-10 p-4 border border-cyan-900/30 text-[10px] uppercase text-cyan-800">
        // Data updated in real-time via D1 Gateway
      </div>
    </div>
  );
}
