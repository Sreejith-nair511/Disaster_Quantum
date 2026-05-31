'use client';

import dynamic from 'next/dynamic';

// Dynamically import the real Leaflet component to prevent Next.js SSR crashes
const LazyMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950/80 rounded-lg border border-slate-800/80 min-h-[400px]">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping"></div>
      </div>
      <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-4">Initializing Tactical GIS Map...</p>
    </div>
  )
});

export default function CommandMap() {
  return <LazyMap />;
}
