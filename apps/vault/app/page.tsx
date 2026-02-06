'use client';
import DeltaScene from '../components/DeltaScene';
import { KMNDPayButton } from '../components/KMNDIntegrator';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 flex flex-col items-center justify-center">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black -z-10" />
        
        {/* The 3D Delta - High Performance */}
        <div className="w-full max-w-2xl transform scale-125">
          <DeltaScene />
        </div>

        <div className="text-center z-10 -mt-20 px-4">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2">
            ⟁KMND
          </h2>
          <p className="text-cyan-500 font-mono tracking-[0.3em] uppercase text-sm mb-8">
            The Sovereign AI Economy of KRYV
          </p>
          
          <div className="flex flex-col gap-4 items-center">
             <KMNDPayButton amount={100} appId="VAULT_PRO" userId="user_demo" />
             <p className="text-gray-600 text-[10px] font-mono">ENCRYPTED AT THE EDGE // WEBGPU ENABLED</p>
          </div>
        </div>
      </section>

      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="fixed inset-0 border-[20px] border-black pointer-events-none" />
    </main>
  );
}
