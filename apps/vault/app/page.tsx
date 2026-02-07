'use client';
import { useUser } from "@clerk/nextjs";
import DeltaScene from '../components/DeltaScene';
import TransactionHistory from '../components/TransactionHistory';
import Leaderboard from '../components/Leaderboard';
import KryvID from '../components/KryvID';

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  // Mock data for Rank - In real, fetch from /leaderboard
  const userRank = "104"; 
  const userBalance = 750; // In real, fetch from /balance

  if (!isLoaded) return <div className="bg-black h-screen flex items-center justify-center text-cyan-500 font-mono">LOADING_NEURAL_LINK...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10">
        
        {/* Left: Identity & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <KryvID balance={userBalance} rank={userRank} />
          <div className="p-4 border border-cyan-900/20 bg-cyan-500/5 rounded-lg">
            <h5 className="text-[10px] text-cyan-500 uppercase font-mono mb-2">System_Status</h5>
            <p className="text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              GATEWAY_ONLINE // D1_CONNECTED
            </p>
          </div>
        </div>

        {/* Center: The Core Symbol */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center">
          <div className="w-full h-[300px]">
            <DeltaScene />
          </div>
          <h2 className="text-5xl font-black text-white italic mt-[-40px]">⟁KMND</h2>
          <a href="/docs" className="mt-8 text-cyan-500 text-xs font-mono border-b border-cyan-500 hover:text-white transition-all">
            VIEW_PROTOCOL_DOCS {" >>"}
          </a>
        </div>

        {/* Right: Activity & Social */}
        <div className="lg:col-span-1 space-y-6">
          <Leaderboard />
          {user && <TransactionHistory userId={user.id} />}
        </div>

      </div>
      
      {/* Background Grid Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
    </main>
  );
}
