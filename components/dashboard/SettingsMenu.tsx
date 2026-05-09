'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Globe, Volume2, VolumeX, ChevronRight, Volume1 } from 'lucide-react';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (!isMuted) {
        audioRef.current.play().catch(err => {
          console.warn("Audio autoplay blocked or failed:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [volume, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src="/background.mp3"
        loop
        autoPlay
      />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-zinc-400 hover:text-white shadow-xl"
        id="settings-gear-button"
      >
        <Settings className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-90 text-accent-cyan' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
              id="settings-dropdown"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">System Parameters</h3>
                  <div className="w-1 h-3 bg-accent-cyan/30 rounded-full" />
                </div>

                {/* Language (Disabled) */}
                <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl opacity-60 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg">
                      <Globe className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400">LANGUAGE</span>
                      <span className="text-[12px] font-black text-white">ENGLISH</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>

                {/* Audio Controls */}
                <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-red-500" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-accent-cyan" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Atmospheric Feed</span>
                    </div>
                    <button
                      onClick={toggleMute}
                      className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                        isMuted ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                      }`}
                    >
                      {isMuted ? 'MUTED' : 'ACTIVE'}
                    </button>
                  </div>

                  {!isMuted && (
                    <div className="flex items-center gap-3 pt-2">
                      <Volume1 className="w-3 h-3 text-zinc-600" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-accent-cyan h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <Volume2 className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Protocol v1.0.4 - Secure Connection</span>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-accent-cyan/5 rounded-full blur-xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
