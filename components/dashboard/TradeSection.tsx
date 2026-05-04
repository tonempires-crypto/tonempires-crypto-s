'use client';

import { motion } from 'motion/react';
import { ArrowLeftRight, ShieldCheck, Box, RefreshCcw } from 'lucide-react';

export default function TradeSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Trade Hub</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Secure Peer-to-Peer Logistics</p>
        </div>
        <ShieldCheck className="w-6 h-6 text-accent-cyan opacity-50" />
      </div>

      <div className="tech-card space-y-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">You Send</span>
            <span className="text-[10px] font-mono text-accent-cyan">Balance: 45,000</span>
          </div>
          <div className="flex gap-3 h-16">
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 font-mono text-xl">
              1,000
            </div>
            <button className="w-24 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase">
              <Box className="w-3 h-3 text-accent-orange" />
              OIL
            </button>
          </div>
        </div>

        <div className="flex justify-center -my-3">
          <div className="w-10 h-10 rounded-full bg-accent-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,255,209,0.4)] z-10">
            <ArrowLeftRight className="w-5 h-5 text-black" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">You Receive</span>
            <span className="text-[10px] font-mono text-accent-cyan">Est. Value</span>
          </div>
          <div className="flex gap-3 h-16">
            <div className="flex-1 bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl flex items-center px-4 font-mono text-xl text-accent-cyan">
              14.20
            </div>
            <button className="w-24 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase">
              TON
            </button>
          </div>
        </div>

        <button className="w-full py-4 rounded-xl bg-accent-cyan text-black font-black uppercase text-sm tracking-widest shadow-[0_0_30px_rgba(0,255,209,0.2)] active:scale-95 transition-all">
          EXECUTE CONTRACT
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5">
          <RefreshCcw className="w-4 h-4 text-zinc-600" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Trade History</span>
        </div>
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5 text-zinc-400">
          <span className="text-base font-bold">1.2%</span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Fee Tier</span>
        </div>
      </div>
    </div>
  );
}
