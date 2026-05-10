'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '@/components/providers/AudioProvider';
import { Shield, Lock, Terminal } from 'lucide-react';
import Image from 'next/image';

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const { playAudio } = useAudio();

  // Fake Loading Logic
  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => {
        const increment = Math.random() * 15;
        setProgress(prev => Math.min(prev + increment, 100));
      }, Math.random() * 300 + 100);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsLoaded(true), 500);
    }
  }, [progress]);

  const handleEnter = () => {
    playAudio();
    setIsVisible(false);
  };

  const loadingMessages = [
    "Establishing Secure Link...",
    "Decrypting Imperial Assets...",
    "Synchronizing Treasury Data...",
    "Neural Interface Ready."
  ];

  const currentMessage = loadingMessages[Math.floor((progress / 100) * (loadingMessages.length - 1))] || loadingMessages[loadingMessages.length - 1];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] bg-[#0A0A0C] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px]"></div>
          
          <div className="relative flex flex-col items-center w-full max-w-xs px-6 gap-8">
            
            {/* Custom Logo Container */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative w-32 h-32"
            >
              <div className="absolute inset-0 bg-accent-cyan/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full rounded-2xl border border-white/10 overflow-hidden bg-zinc-900 shadow-2xl">
                <Image 
                  src="https://ik.imagekit.io/orwcrid1r/Gemini_Generated_Image_aq6vtqaq6vtqaq6v.png?updatedAt=1777663199175"
                  alt="Empire Logo"
                  fill
                  className="object-cover"
                  priority
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Title */}
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl font-black text-white italic tracking-tighter uppercase"
              >
                TON <span className="text-accent-cyan">EMPIRES</span>
              </motion.h1>
            </div>

            {/* Loading Section */}
            <div className="w-full space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-mono text-accent-cyan flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> {isLoaded ? "SYSTEM READY" : currentMessage}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-bold">{Math.floor(progress)}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                />
              </div>
            </div>

            {/* Action Button (Appears after load) */}
            <div className="h-12 w-full flex justify-center">
              <AnimatePresence>
                {isLoaded && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnter}
                    className="relative px-8 py-2.5 bg-accent-cyan text-black font-black uppercase italic text-xs tracking-widest rounded-lg border-b-4 border-black/20 hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
                  >
                    Enter your Empire
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Metadata */}
            <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-30">
              <div className="flex gap-4 text-[8px] font-mono text-zinc-400 uppercase tracking-widest text-[#666]">
                <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> SECURE_ENCLAVE</span>
                <span>BETA_SYNC_2.4.0</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
