'use client';
import DeltaScene from '../components/DeltaScene';
import TransactionHistory from '../components/TransactionHistory';
import Leaderboard from '../components/Leaderboard'; // New
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { user } = useUser();

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto py-20">
        <DeltaScene />
        <div className="text-center mb-20">
          <h1 className="text-7xl font-black italic text-cyan-400">⟁KMND</h1>
          <p className="opacity-50 font-mono uppercase tracking-widest">Neural Assets for KRYV</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {user && <TransactionHistory userId={user.id} />}
          <Leaderboard />
        </div>
      </div>
    </main>
  );
}
