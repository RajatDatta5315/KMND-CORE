'use client';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetch('https://gateway.kryv.network/leaderboard')
      .then(res => res.json())
      .then(data => setLeaders(data.leaders || []));
  }, []);

  return (
    <div className="border border-cyan-900/30 bg-black/50 p-6 backdrop-blur-xl">
      <h3 className="text-cyan-400 font-mono text-sm mb-4">TOP_MINDS // RANKING</h3>
      {leaders.map((l: any, i) => (
        <div key={l.id} className="flex justify-between text-xs py-2 border-b border-white/5 font-mono">
          <span className="text-gray-500">#{i+1} {l.id.substring(0, 8)}...</span>
          <span className="text-cyan-400">⟁{l.balance}</span>
        </div>
      ))}
    </div>
  );
}
