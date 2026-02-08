'use client';
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import DeltaScene from '../components/DeltaScene';
import Leaderboard from '../components/Leaderboard';
import KryvID from '../components/KryvID';

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div className="bg-black h-screen flex items-center justify-center text-cyan-500 font-mono italic">INITIALIZING_NEURAL_LINK...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 selection:bg-cyan-500 selection:text-black">
      {/* Header with Login */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-10 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-black" />
          </div>
          <span className="font-mono font-bold tracking-tighter">KRYV_VAULT</span>
        </div>
        <div>
          {user ? <UserButton afterSignOutUrl="/" /> : <SignInButton mode="modal"><button className="text-xs border border-white px-4 py-1 hover:bg-white hover:text-black transition-all font-mono uppercase">Sync_Profile</button></SignInButton>}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <KryvID balance={1250} rank="04" />
          <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded font-mono text-[10px] text-gray-500">
             SYSTEM_STABLE // NO_LEAKS_DETECTED // GATEWAY_V1.1
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col items-center">
          <div className="w-full h-[400px]">
            <DeltaScene />
          </div>
          <h1 className="text-7xl font-black italic tracking-tighter mt-[-60px] text-white">⟁KMND</h1>
          <a href="/docs" className="mt-10 group flex items-center gap-2 font-mono text-[10px] text-cyan-400 uppercase tracking-widest border border-cyan-400/20 px-6 py-3 rounded-full hover:bg-cyan-400 hover:text-black transition-all">
            Open_Protocol_Documentation <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        <div className="lg:col-span-1">
          <Leaderboard />
        </div>
      </div>
    </main>
  );
}
