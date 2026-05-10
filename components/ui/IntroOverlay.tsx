'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '@/components/providers/AudioProvider';
import { Zap, Shield, Cpu } from 'lucide-react';

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const { playAudio } = useAudio();

  const handleEnter = () => {
    playAudio();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-center items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          <div className="relative flex flex-col items-center gap-12 px-6">
            {/* Logo/Icon Container */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-3xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center relative z-10">
                <Cpu className="w-12 h-12 text-accent-cyan" />
              </div>
              {/* Outer Glow Circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-cyan/5 rounded-full blur-3xl animate-pulse"></div>
            </motion.div>

            {/* Content Group */}
            <div className="text-center space-y-4">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase"
              >
                TON <span className="text-accent-cyan">EMPIRES</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.6 }}
                className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em]"
              >
                Neural Sync Required
              </motion.p>
            </div>

            {/* Interaction Button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.8 }}
              onClick={handleEnter}
              className="group relative flex items-center justify-center px-8 py-4 bg-accent-cyan text-black font-black uppercase italic text-sm tracking-widest rounded-xl hover:bg-white transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-4 h-4 fill-current" />
                Initialize System
              </span>
            </motion.button>

            {/* Footer Stats/Meta */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex gap-8 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" /> Encrypted Link
              </div>
              <div className="flex items-center gap-2">
               v2.4.0-Beta
              </div>
            </motion.div>
          </div>

          {/* Side Accents */}
          <div className="absolute top-10 left-10 w-20 h-px bg-zinc-800 hidden md:block"></div>
          <div className="absolute bottom-10 right-10 w-20 h-px bg-zinc-800 hidden md:block"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
