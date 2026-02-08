export default function DocsPage() {
  const domain = "kmnd.kryv.network";

  return (
    <div className="max-w-4xl mx-auto p-10 font-sans text-gray-300">
      <header className="mb-16">
        <h1 className="text-5xl font-black mb-4 text-white italic tracking-tighter uppercase">Developer_Protocol // ⟁KMND</h1>
        <p className="text-cyan-500 font-mono text-xs tracking-widest uppercase italic">Secure Proxy Gateway Active</p>
      </header>
      
      <section className="mb-16 border-l-2 border-cyan-900 pl-6">
        <h2 className="text-2xl font-bold mb-4 text-white font-mono uppercase tracking-tighter italic">1. Setup_Ecosystem_SDK</h2>
        <p className="text-sm mb-6 opacity-70">Inject this into your header. No registration required—your <code className="text-white font-bold">appId</code> is automatically registered on first transaction.</p>
        <pre className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm mb-6">
          <code className="text-cyan-400">
{`<script src="https://${domain}/kmnd-sdk.js"></script>`}
          </code>
        </pre>
        
        <h3 className="text-xs font-bold text-white mb-4 uppercase">Implementation Example:</h3>
        <pre className="bg-black p-4 rounded border border-zinc-800 text-[11px] text-green-400 leading-relaxed">
{`// Initialize payment
// The system detects your App ID dynamically
const tx = await KMND.pay(
  user.id, 
  50, 
  "ANY_APP_NAME" // Your custom app ID here
);

if (tx.success) {
  unlockNeuralFeature();
}`}
        </pre>
      </section>

      <section className="p-8 bg-zinc-900/30 border border-zinc-800 rounded">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-[0.2em]">Transaction_Privacy</h2>
        <p className="text-xs leading-relaxed opacity-60">
          The ⟁KMND network enforces user-level encryption. Global feeds display anonymized activity only. 
          Detailed logs are restricted to the transacting parties and authorized network nodes.
        </p>
      </section>

      <footer className="mt-20 text-[10px] opacity-20 text-center uppercase tracking-[2em]">
        KRYV_SYSTEMS_GLOBAL
      </footer>
    </div>
  );
}
