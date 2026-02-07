import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminTerminal() {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  // Security Lock
  if (!user || user.emailAddresses[0].emailAddress !== adminEmail) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono p-8 border-t-4 border-red-600">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-red-900/30 pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">KRYV_ROOT_ACCESS</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-[0.3em]">Neural Terminal // Admin: {user.firstName}</p>
          </div>
          <div className="text-right text-[10px]">
             <span className="text-green-500 animate-pulse font-bold tracking-widest">SYSTEM_STABLE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Override Balance */}
          <div className="border border-red-900/50 bg-red-900/5 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-red-900 pb-2 uppercase tracking-tighter">Balance_Override</h3>
            <form className="space-y-4">
              <input type="text" placeholder="TARGET_USER_ID" className="w-full bg-black border border-red-900 p-3 text-xs outline-none focus:border-red-500 text-white" />
              <input type="number" placeholder="KMND_AMOUNT (+/-)" className="w-full bg-black border border-red-900 p-3 text-xs outline-none focus:border-red-500 text-white" />
              <button className="w-full bg-red-600 text-black font-black py-3 hover:bg-red-500 transition-all uppercase text-xs">Execute_Command</button>
            </form>
          </div>

          {/* Restriction Hub */}
          <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-zinc-800 pb-2 uppercase tracking-tighter">Neural_Restriction</h3>
            <div className="space-y-4">
              <input type="text" placeholder="USER_UID_TO_SYNC" className="w-full bg-black border-zinc-800 border p-3 text-xs outline-none text-white" />
              <div className="flex gap-2">
                <button className="flex-1 bg-white text-black font-black py-3 text-xs hover:bg-gray-200 uppercase">Ban_User</button>
                <button className="flex-1 border border-zinc-700 text-white font-black py-3 text-xs hover:bg-zinc-800 uppercase">Lift_Ban</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
