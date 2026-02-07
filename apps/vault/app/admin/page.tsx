import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminTerminal() {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  // Extremely Strict Security
  if (!user || user.emailAddresses[0].emailAddress !== adminEmail) {
    redirect("/"); 
  }

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono p-8 border-t-4 border-red-600">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-red-900/30 pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">KRYV_ROOT_ACCESS</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-[0.3em]">Neural Terminal // Protocol 77</p>
          </div>
          <div className="text-right text-[10px]">
            <p>ADMIN: {user.firstName}</p>
            <p className="text-green-500 animate-pulse font-bold">SYSTEM_STABLE</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Override Section */}
          <div className="border border-red-900/50 bg-red-900/5 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-red-900 pb-2">MANUAL_OVERRIDE</h3>
            <div className="space-y-4">
              <input type="text" placeholder="USER_ID" className="w-full bg-black border border-red-900 p-2 text-xs outline-none focus:border-red-500" />
              <input type="number" placeholder="AMOUNT_TO_ADD_OR_SUB" className="w-full bg-black border border-red-900 p-2 text-xs outline-none focus:border-red-500" />
              <button className="w-full bg-red-600 text-black font-black py-2 hover:bg-red-500 transition-colors uppercase text-xs">Execute_Transaction</button>
            </div>
          </div>

          {/* Ban/Unban Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-zinc-800 pb-2">NEURAL_RESTRICTION (BAN)</h3>
            <div className="space-y-4">
              <input type="text" placeholder="USER_ID_TO_RESTRICT" className="w-full bg-black border-zinc-800 border p-2 text-xs outline-none" />
              <div className="flex gap-2">
                <button className="flex-1 bg-white text-black font-black py-2 text-xs hover:bg-gray-200 uppercase">Restrict</button>
                <button className="flex-1 border border-zinc-700 text-white font-black py-2 text-xs hover:bg-zinc-800 uppercase">Un-Restrict</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
