'use client';
import { useEffect, useState } from 'react';

export default function SystemAlert({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed bottom-10 right-10 p-4 border font-mono text-[10px] animate-slide-up z-50 
      ${type === 'success' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-cyan-500' : 'bg-red-500'}`} />
        <div>
          <p className="uppercase font-black">{type === 'success' ? 'TRANSACTION_CONFIRMED' : 'SYSTEM_ERROR'}</p>
          <p className="opacity-70 tracking-tighter">{message}</p>
        </div>
      </div>
    </div>
  );
}
