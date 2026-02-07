'use client';
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function AdminTerminal() {
  const { user } = useUser();
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState({ msg: "SYSTEM_IDLE", type: "info" });

  const adminEmail = "your-email@kryv.network"; // Same as your env secret

  const triggerAction = async (action: string, val?: number) => {
    setStatus({ msg: "EXECUTING_PROTOCOL...", type: "info" });
    try {
      const res = await fetch("https://kmnd-core.rajat.workers.dev/admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId, amount: val || Number(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ msg: data.message, type: "success" });
      } else {
        setStatus({ msg: "PROTOCOL_FAILED", type: "error" });
      }
    } catch (err) {
      setStatus({ msg: "GATEWAY_TIMEOUT", type: "error" });
    }
  };

  if (user?.emailAddresses[0].emailAddress !== adminEmail) return null;

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono p-8 border-t-4 border-red-600">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-red-900/30 pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic">KRYV_ROOT_ACCESS</h1>
            <p className={`text-xs mt-2 ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {status.msg}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Override Balance */}
          <div className="border border-red-900/50 bg-red-900/5 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-red-900 pb-2 uppercase italic">Balance_Override</h3>
            <div className="space-y-4">
              <input onChange={(e)=>setTargetId(e.target.value)} type="text" placeholder="TARGET_USER_ID" className="w-full bg-black border border-red-900 p-3 text-xs outline-none focus:border-red-500 text-white" />
              <input onChange={(e)=>setAmount(e.target.value)} type="number" placeholder="KMND_AMOUNT (+/-)" className="w-full bg-black border border-red-900 p-3 text-xs outline-none focus:border-red-500 text-white" />
              <button onClick={() => triggerAction("OVERRIDE")} className="w-full bg-red-600 text-black font-black py-3 hover:bg-red-500 transition-all uppercase text-xs">Execute_Command</button>
            </div>
          </div>

          {/* Restriction Hub */}
          <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-lg">
            <h3 className="text-white text-sm mb-4 border-b border-zinc-800 pb-2 uppercase italic">Neural_Restriction</h3>
            <div className="space-y-4">
              <input onChange={(e)=>setTargetId(e.target.value)} type="text" placeholder="USER_UID_TO_SYNC" className="w-full bg-black border-zinc-800 border p-3 text-xs outline-none text-white" />
              <div className="flex gap-2">
                <button onClick={() => triggerAction("BAN")} className="flex-1 bg-white text-black font-black py-3 text-xs hover:bg-gray-200 uppercase">Ban_User</button>
                <button onClick={() => triggerAction("UNBAN")} className="flex-1 border border-zinc-700 text-white font-black py-3 text-xs hover:bg-zinc-800 uppercase">Lift_Ban</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
