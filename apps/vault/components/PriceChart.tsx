'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_KMND_API || '';

// Demo price history — simulates organic growth
function generateDemoHistory() {
  const points = [];
  let price = 0.001;
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    price = Math.max(0.0005, price * (1 + (Math.random() - 0.35) * 0.08));
    points.push({ price: parseFloat(price.toFixed(6)), recorded_at: new Date(now - i * 3600000).toISOString() });
  }
  return points;
}

export default function PriceChart() {
  const [history, setHistory] = useState<{price:number;recorded_at:string}[]>([]);
  const [current, setCurrent] = useState<number|null>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    const demo = generateDemoHistory();
    if (!API) { setHistory(demo); setCurrent(demo[demo.length-1].price); return; }
    fetch(`${API}/price/history`)
      .then(r=>r.json())
      .then(d=>{
        if (d.history?.length > 1) { setHistory(d.history); setCurrent(d.history[d.history.length-1].price); setIsDemo(false); }
        else { setHistory(demo); setCurrent(demo[demo.length-1].price); }
      })
      .catch(()=>{ setHistory(demo); setCurrent(demo[demo.length-1].price); });
  },[]);

  if (!history.length) return null;

  const prices = history.map(h=>h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.0001;
  const w = 700, h = 120, pad = 10;
  const points = history.map((pt,i) => {
    const x = pad + (i / (history.length-1)) * (w - pad*2);
    const y = h - pad - ((pt.price - min) / range) * (h - pad*2);
    return `${x},${y}`;
  }).join(' ');

  const first = prices[0], last = prices[prices.length-1];
  const change = ((last - first) / first * 100);
  const isUp = change >= 0;

  return (
    <div className="border border-white/5 rounded-2xl bg-black/60 p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">⟁KMND Price</p>
            {isDemo&&<span className="text-[9px] font-mono text-yellow-700 border border-yellow-700/30 px-2 py-0.5 rounded-full">DEMO</span>}
          </div>
          <p className="font-black text-2xl text-white tabular-nums">
            ${current?.toFixed(6) || '0.001000'}
            <span className={`ml-2 text-sm font-bold ${isUp?'text-green-500':'text-red-500'}`}>
              {isUp?'↑':'↓'} {Math.abs(change).toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div><p className="text-[9px] text-gray-700 font-mono">24H HIGH</p><p className="font-mono text-xs text-white">${max.toFixed(6)}</p></div>
          <div><p className="text-[9px] text-gray-700 font-mono">24H LOW</p><p className="font-mono text-xs text-white">${min.toFixed(6)}</p></div>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp?"#22c55e":"#ef4444"} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={isUp?"#22c55e":"#ef4444"} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={`${pad},${h} ${points} ${w-pad},${h}`} fill="url(#chartGrad)"/>
        <polyline points={points} fill="none" stroke={isUp?"#22c55e":"#ef4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <div className="flex justify-between text-[9px] font-mono text-gray-700 px-1">
        <span>{new Date(history[0].recorded_at).toLocaleDateString()}</span>
        <span>{history.length} data points · {isDemo?'simulated':'live'}</span>
        <span>{new Date(history[history.length-1].recorded_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
