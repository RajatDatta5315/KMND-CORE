'use client';
import { useUser } from "@clerk/nextjs";

export default function KryvID({ balance, rank }: { balance: number, rank: string }) {
  const { user } = useUser();

  return (
    <div className="relative w-full max-w-sm p-[2px] bg-gradient-to-br from-cyan-500 via-transparent to-cyan-900 overflow-hidden rounded-xl">
      <div className="bg-black p-6 rounded-[10px] relative overflow-hidden">
        {/* Decorative Circuit Lines */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.2em]">Neural_Identity</p>
            <h4 className="text-xl font-bold text-white tracking-tighter italic">⟁ KMND_CORE</h4>
          </div>
          <div className="w-10 h-10 border border-cyan-500/20 rounded-full flex items-center justify-center">
             <span className="text-cyan-400 text-[10px] font-mono">#{rank}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <img src={user?.imageUrl} className="w-14 h-14 rounded-full border border-cyan-500/30 grayscale" alt="User" />
          <div>
            <p className="text-white font-bold text-sm">{user?.fullName || "KRYV_OPERATOR"}</p>
            <p className="text-xs text-gray-500 font-mono">UID: {user?.id.substring(0, 12)}</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-mono">Available_Energy</p>
            <p className="text-2xl font-black text-cyan-400">⟁ {balance}</p>
          </div>
          <div className="h-2 w-2 bg-cyan-500 animate-pulse rounded-full shadow-[0_0_10px_#00f3ff]" />
        </div>
      </div>
    </div>
  );
}
