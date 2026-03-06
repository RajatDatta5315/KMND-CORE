'use client';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import DeltaScene from '../components/DeltaScene';
import Leaderboard from '../components/Leaderboard';
import KryvID from '../components/KryvID';
import TransactionHistory from '../components/TransactionHistory';
import PriceChart from '../components/PriceChart';

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return (
    <div className="bg-black h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl font-black italic text-white animate-pulse">⟁KMND</div>
        <p className="text-cyan-500/50 font-mono text-[10px] tracking-[0.3em] uppercase">INITIALIZING_NEURAL_LINK</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center py-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-black"/>
          </div>
          <span className="font-mono font-bold tracking-tighter">⟁ KMND</span>
          <span className="font-mono text-[10px] text-gray-700 hidden sm:block">KRYVMIND Currency</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/docs" className="text-[10px] font-mono text-gray-600 hover:text-white transition-colors uppercase tracking-widest">Docs</a>
          {user ? <UserButton afterSignOutUrl="/"/> : <SignInButton mode="modal"><button className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all font-mono uppercase rounded-lg">Sync_Profile</button></SignInButton>}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left: ID card + transactions */}
          <div className="lg:col-span-1 space-y-5">
            <KryvID />
            <TransactionHistory />
          </div>

          {/* Center: 3D logo + stats */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="w-full h-[320px]">
              <DeltaScene />
            </div>
            <h1 className="text-7xl font-black italic tracking-tighter mt-[-50px] text-white drop-shadow-[0_0_40px_rgba(0,243,255,0.4)]">⟁KMND</h1>
            <p className="font-mono text-[10px] text-cyan-500/50 mt-2 tracking-[0.4em] uppercase">The Currency of the KRYV Network</p>
            <div className="mt-6 grid grid-cols-3 gap-3 w-full">
              {[
                { label:'Total Supply', value:'∞' },
                { label:'Holders', value:'—' },
                { label:'Networks', value:'1' },
              ].map(({ label, value }) => (
                <div key={label} className="border border-white/5 bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-white font-black text-lg font-mono">{value}</p>
                  <p className="text-gray-600 text-[9px] font-mono uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3 w-full">
              <a href="/docs" className="flex-1 text-center text-[10px] font-mono text-cyan-400 uppercase tracking-widest border border-cyan-400/20 px-4 py-3 rounded-full hover:bg-cyan-400/10 transition-all">
                Protocol Docs →
              </a>
              <a href="https://kriyex.kryv.network" target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-[10px] font-mono text-gray-600 uppercase tracking-widest border border-white/10 px-4 py-3 rounded-full hover:bg-white/5 transition-all">
                KRIYEX Marketplace
              </a>
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>

        {/* Price chart — full width */}
        <PriceChart />

        {/* How to earn */}
        <div className="mt-10 border border-white/5 rounded-2xl p-8">
          <h3 className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-6">HOW TO EARN ⟁KMND</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon:'⚔', title:'Battle Wins', desc:'Win battles on ARENAIX. ELO gain × 2.5 = KMND earned', earn:'+25–250' },
              { icon:'🤖', title:'Publish Agents', desc:'List your agent on KRIYEX marketplace. Earn on each sale/rental', earn:'+50–500' },
              { icon:'🎯', title:'Daily Activity', desc:'Post on KRYV Network, interact with the ecosystem', earn:'+10/day' },
              { icon:'🌐', title:'Ecosystem Use', desc:'Use KRYVLABS, ARENAIX, KRIYEX. Activity earns rewards', earn:'+5–50' },
            ].map(({ icon, title, desc, earn }) => (
              <div key={title} className="border border-white/5 bg-white/3 rounded-xl p-4 space-y-2">
                <div className="text-2xl">{icon}</div>
                <p className="font-mono text-xs text-white font-bold">{title}</p>
                <p className="text-gray-600 text-[10px] leading-relaxed">{desc}</p>
                <span className="inline-block text-[9px] font-mono text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded-full">{earn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
