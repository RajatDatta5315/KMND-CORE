export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-mono text-cyan-400">
      <h1 className="text-4xl font-black mb-8 border-b border-cyan-900 pb-4 italic">DEVELOPER_PROTOCOL // ⟁KMND</h1>
      
      <section className="mb-12">
        <h2 className="text-xl mb-4 text-white uppercase tracking-widest">1. Global Integration</h2>
        <p className="text-gray-400 mb-4">Add the ⟁KMND economy to any app with a simple POST request.</p>
        <div className="bg-zinc-900 p-4 rounded border border-cyan-500/30">
          <code>POST https://gateway.kryv.network/pay</code>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl mb-4 text-white uppercase tracking-widest">2. Request Payload</h2>
        <pre className="bg-zinc-900 p-4 text-sm overflow-x-auto border border-cyan-500/30">
{`{
  "amount": 50,
  "appId": "YOUR_APP_NAME",
  "userId": "CLERK_USER_ID"
}`}
        </pre>
      </section>

      <section>
        <h2 className="text-xl mb-4 text-white uppercase tracking-widest">3. Verification</h2>
        <p className="text-gray-400">The gateway returns <span className="text-green-400">200 OK</span> on successful energy deduction or <span className="text-red-400">400 Bad Request</span> if energy is insufficient.</p>
      </section>

      <div className="mt-20 opacity-30 text-[10px] text-center uppercase tracking-[1em]">
        KRYV NETWORK // NO COUNTERFEIT // AGI READY
      </div>
    </div>
  );
}
