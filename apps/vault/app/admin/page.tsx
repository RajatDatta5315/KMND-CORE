import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function AdminTerminal() {
  const user = await currentUser();
  
  // Hardcoded Security: Only YOU can enter
  if (user?.emailAddresses[0].emailAddress !== "your-email@kryv.network") {
    return redirect("/"); // Bhaga do baakiyon ko
  }

  return (
    <div className="bg-black min-h-screen p-10 font-mono text-red-500">
      <h1 className="text-3xl font-black mb-10 tracking-tighter">⟁ KRYV_ROOT_TERMINAL</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="border border-red-900/50 p-6 bg-red-500/5">
          <h2 className="text-white mb-4">MANUAL_OVERRIDE (Edit Balance)</h2>
          <input className="bg-zinc-900 border border-red-900 w-full p-2 mb-4" placeholder="User UID" />
          <input className="bg-zinc-900 border border-red-900 w-full p-2 mb-4" placeholder="Amount (+/-)" />
          <button className="bg-red-600 text-white w-full py-2 hover:bg-red-700 transition-all">EXECUTE_TRANSACTION</button>
        </div>

        <div className="border border-gray-900 p-6 bg-white/5">
          <h2 className="text-white mb-4">SYSTEM_STATS</h2>
          <p className="text-xs">TOTAL_SUPPLY: 1,000,000 ⟁KMND</p>
          <p className="text-xs">TOTAL_BURNED: 12,450 ⟁KMND</p>
          <p className="text-xs text-green-500 mt-4 italic">// NEURAL_LINK_STABLE</p>
        </div>
      </div>
    </div>
  );
}
