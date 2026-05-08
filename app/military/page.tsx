'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sword, Shield, Target, ShoppingBag, Trophy } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function MilitaryCampPage() {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = () => {
    setNotification("Imperial Military Command: Deployment protocols under development. Modules coming soon.");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col font-sans">
      {/* BACKGROUND IMAGE - Fixed and Custom Cover */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-center bg-cover"
        style={{ 
          backgroundImage: `url('https://ik.imagekit.io/o8kv1qv3h/ChatGPT%20Image%20May%208,%202026,%2006_02_51%20PM.png')`,
          backgroundAttachment: 'fixed'
        }}
      />

      {/* HEADER OVERLAY */}
      <div className="relative z-[100] p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-black/40 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Military Camp</h1>
            <span className="text-[10px] font-mono text-accent-cyan uppercase">Command & Control Sector</span>
          </div>
        </div>
      </div>

      {/* BUILDINGS & INTERFACE CONTAINER */}
      <div className="relative flex-1 w-full max-w-md mx-auto z-10 px-6 pt-4 space-y-8">
        
        {/* TOP STATS CHARTS */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* STRENGTH CHART */}
          <div className="tech-card bg-black/60 border-red-500/30 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Military Strength Index</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-red-500/40" />)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Attack</span>
                  <span className="text-xl font-black italic text-white leading-none">842</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Defense</span>
                  <span className="text-xl font-black italic text-white leading-none">615</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '55%' }}
                    className="h-full bg-accent-cyan shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                  />
                </div>
              </div>
            </div>
            
            {/* Background design elements */}
            <div className="absolute -bottom-2 -left-2 w-12 h-12 border-l border-b border-red-500/20" />
            <div className="absolute -top-2 -right-2 w-12 h-12 border-r border-t border-red-500/20" />
          </div>

          {/* LEVEL CHART */}
          <div className="tech-card bg-black/60 border-accent-cyan/20 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-accent-cyan" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan">Imperial Rank</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">LVL 42 / 100</span>
            </div>
            
            <div className="relative py-2">
              <div className="h-4 w-full bg-zinc-900 border border-white/5 p-0.5 rounded-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  className="h-full bg-gradient-to-r from-accent-cyan/20 via-accent-cyan to-white/80 relative"
                >
                  <div className="absolute top-0 right-0 h-full w-px bg-white shadow-[0_0_8px_white]" />
                </motion.div>
              </div>
              
              {/* Ticks */}
              <div className="flex justify-between mt-1 px-0.5">
                {[0, 25, 50, 75, 100].map(val => (
                  <span key={val} className="text-[7px] font-mono text-zinc-600">{val}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* INTERACTIVE BUTTONS ROW */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={showNotification}
            className="group relative h-24 bg-zinc-900/40 border border-white/10 hover:border-accent-cyan/50 transition-all rounded-lg overflow-hidden flex flex-col items-center justify-center gap-2"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <Target className="w-6 h-6 text-zinc-500 group-hover:text-accent-cyan transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-white">Training Range</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={showNotification}
            className="group relative h-24 bg-zinc-900/40 border border-white/10 hover:border-red-500/50 transition-all rounded-lg overflow-hidden flex flex-col items-center justify-center gap-2"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShoppingBag className="w-6 h-6 text-zinc-500 group-hover:text-red-500 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-white">The Shop</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </motion.button>
        </div>

      </div>

      {/* COMING SOON NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-[80%] max-w-xs"
          >
            <div className="bg-zinc-900 border border-accent-cyan/30 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-cyan/10 rounded-lg">
                  <Sword className="w-4 h-4 text-accent-cyan" />
                </div>
                <span className="text-[10px] font-black uppercase text-accent-cyan tracking-widest">Direct Message</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                {notification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER DECOR */}
      <div className="relative z-[100] p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex justify-between items-center opacity-40">
          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Auth: Imperial-Core-v1.2</div>
          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Sector: Military-Alpha-09</div>
        </div>
      </div>
    </div>
  );
}
