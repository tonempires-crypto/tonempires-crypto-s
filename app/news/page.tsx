'use client';

import { motion } from 'motion/react';
import { ArrowLeft, Bell, ChevronRight, Newspaper, Zap } from 'lucide-react';
import Link from 'next/link';

export default function NewsPage() {
  const updates = [
    {
      id: 1,
      title: "Global P2P Relay V2.0 Online",
      date: "2024-05-08",
      category: "Market",
      content: "The Imperial Trade Relay has been optimized. P2P contracts now sync directly with global resource indexes to ensure fair market value across all sovereign nodes.",
      tag: "NEW"
    },
    {
      id: 2,
      title: "Resource Scarcity Alert",
      date: "2024-05-07",
      category: "System",
      content: "Recent logistics disruptions have increased the scarcity scale for Gold. Production remains stable, but global reserves are being monitored for inflation.",
      tag: "URGENT"
    },
    {
      id: 3,
      title: "Imperial Audit Completion",
      date: "2024-05-06",
      category: "Security",
      content: "Sovereign Vault protocols have been reinforced. All resource conversions and cross-region transfers are now logged on the immutable imperial ledger.",
      tag: "INFO"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-accent-cyan/30">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-md mx-auto p-4 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Imperial Archive</h1>
            <span className="text-xs font-bold text-white tracking-widest">SYSTEM UPDATES</span>
          </div>
          <Bell className="w-5 h-5 text-accent-cyan" />
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-12">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 p-6">
          <div className="absolute top-0 right-0 p-4">
             <Newspaper className="w-12 h-12 text-white/5" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Live Broadcast</span>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter mb-2">COMMUNITY CHRONICLE</h2>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
              Stay synchronized with the latest logistical directives and empire expansions.
            </p>
          </div>
        </div>

        {/* FEED */}
        <div className="space-y-4">
          {updates.map((update, index) => (
            <motion.div 
              key={update.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="tech-card bg-zinc-900/40 p-5 border-white/5 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-accent-cyan uppercase">{update.category}</span>
                    <span className="text-[10px] font-mono text-zinc-600">— {update.date}</span>
                  </div>
                  <h3 className="text-sm font-black uppercase text-white group-hover:text-accent-cyan transition-colors">
                    {update.title}
                  </h3>
                </div>
                {update.tag && (
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    update.tag === 'NEW' ? 'bg-emerald-500 text-black' : 
                    update.tag === 'URGENT' ? 'bg-red-500 text-white' : 
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {update.tag}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                {update.content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[9px] font-mono text-zinc-600 uppercase">Archive ID: #{update.id.toString().padStart(4, '0')}</span>
                <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-zinc-400 hover:text-white transition-colors">
                  Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-white/0 via-white/5 to-white/0" />
            </motion.div>
          ))}
        </div>

        {/* SYSTEM STATUS */}
        <div className="tech-card p-4 bg-zinc-900/20 border-dashed border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-emerald-500" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white">Central Node Online</p>
              <p className="text-[8px] font-mono text-emerald-500 uppercase">Uptime: 99.99%</p>
            </div>
          </div>
          <span className="text-[8px] font-mono text-zinc-600">v1.2.4-stable</span>
        </div>
      </main>
    </div>
  );
}
