'use client';

import { motion } from 'motion/react';
import { Users, Copy, Share2, Award, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReferralSection({ userId }: { userId: string | number }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://t.me/TONEMPIRES_bot/play?startapp=${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Join me in Ton Empires! Build your empire and earn TON. 🚀`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    // @ts-ignore
    window.Telegram?.WebApp?.openTelegramLink(shareUrl);
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tech-card bg-gradient-to-br from-accent-cyan/10 to-transparent border-accent-cyan/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase">Imperial Recruitment</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Growth Phase: Active</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Your Unique Recruitment Link:</span>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-transparent border-none text-xs font-mono text-zinc-300 focus:ring-0 truncate"
              />
              <button 
                onClick={handleCopy}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <Copy className={`w-4 h-4 ${copied ? 'text-accent-cyan' : 'text-zinc-400'}`} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-accent-cyan text-black font-black uppercase text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,209,0.3)] active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Recruit New Citizens
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 space-y-2">
          <div className="flex justify-between items-start">
            <Zap className="w-4 h-4 text-accent-orange" />
            <span className="text-[10px] font-mono text-zinc-500">BOOST</span>
          </div>
          <div className="text-2xl font-black text-white">20%</div>
          <p className="text-[9px] text-zinc-500 leading-tight">Bonus from all friend deposits</p>
        </div>
        
        <div className="bento-card p-4 space-y-2">
          <div className="flex justify-between items-start">
            <Award className="w-4 h-4 text-accent-blue" />
            <span className="text-[10px] font-mono text-zinc-500">RANK</span>
          </div>
          <div className="text-2xl font-black text-white">#0</div>
          <p className="text-[9px] text-zinc-500 leading-tight">Total successful recruits</p>
        </div>
      </div>
    </div>
  );
}
