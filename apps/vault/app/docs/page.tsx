export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-10 font-sans text-gray-300">
      <header className="mb-16">
        <h1 className="text-5xl font-black mb-4 text-white italic tracking-tighter uppercase">Developer_Protocol // ⟁KMND</h1>
        <p className="text-cyan-500 font-mono text-xs tracking-widest uppercase">Version 1.0.2 Stable // Bridge_Active</p>
      </header>
      
      {/* SDK Section */}
      <section className="mb-16 border-l-2 border-cyan-900 pl-6">
        <h2 className="text-2xl font-bold mb-4 text-white font-mono uppercase tracking-tighter">1. Universal_Bridge_SDK</h2>
        <p className="mb-4">Add this script to your project to use the global <code className="text-cyan-400">KMND</code> object.</p>
        <pre className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm overflow-x-auto mb-4">
          <code className="text-cyan-300">
{`<script src="https://vault.kryv.network/kmnd-sdk.js"></script>`}
          </code>
        </pre>
        <h3 className="text-sm font-bold text-white mb-2 uppercase">Usage:</h3>
        <pre className="bg-black p-4 rounded border border-zinc-800 text-xs text-green-400">
{`// Trigger a payment in KRIYEX or VELQA
const tx = await KMND.pay("user_id_123", 100, "APP_NAME");

if (tx.success) {
  console.log("ENERGY_TRANSFER_COMPLETE");
}`}
        </pre>
      </section>

      {/* API Section */}
      <section className="mb-16 border-l-2 border-red-900 pl-6">
        <h2 className="text-2xl font-bold mb-4 text-white font-mono uppercase tracking-tighter">2. Direct_API_Access</h2>
        <div className="bg-zinc-900/50 p-6 rounded border border-red-900/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-600 text-black px-2 py-1 text-[10px] font-bold">POST</span>
            <code className="text-white text-sm">https://kmnd-core.rajat.workers.dev/transfer</code>
          </div>
          <p className="text-xs mb-4 text-gray-500 font-mono uppercase">// Required Payload</p>
          <pre className="text-sm text-gray-400 leading-relaxed">
{`{
  "fromId": "SENDER_ID",
  "toId": "RECEIVER_ID",
  "amount": 50,
  "appId": "ECOSYSTEM_APP"
}`}
          </pre>
        </div>
      </section>

      {/* Tax Notice */}
      <section className="p-6 bg-cyan-900/5 border border-cyan-900/20 rounded">
        <h3 className="text-white font-bold mb-2 uppercase italic text-sm underline">Economy_Notice (2% NEURAL_TAX)</h3>
        <p className="text-xs leading-relaxed opacity-70">
          Every transaction via the Bridge incurs a 2% Tax. 
          1% is automatically <span className="text-red-500">BURNED</span> for token stability. 
          1% is sent to <span className="text-cyan-500">KRYV_VAULT</span> for infrastructure.
        </p>
      </section>

      <footer className="mt-20 text-[10px] opacity-20 text-center uppercase tracking-[2em]">
        KRYV_SYSTEMS_INTL
      </footer>
    </div>
  );
}
