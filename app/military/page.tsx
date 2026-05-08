'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sword } from 'lucide-react';
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

      {/* MAIN SCENE WRAPPER - Centered container that maintains aspect ratio */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
        <div className="relative w-full aspect-video max-h-full">
          {/* BACKGROUND IMAGE - Maintaining landscape aspect ratio via object-contain */}
          <img 
            src="https://ik.imagekit.io/o8kv1qv3h/ChatGPT%20Image%20May%208,%202026,%2006_02_51%20PM.png"
            className="w-full h-full object-contain pointer-events-none select-none"
            alt="Military Base Background"
          />

          {/* BUILDINGS CONTAINER - These are now anchored to the background image box */}
          
          {/* Building 2: Back-Right Building */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={showNotification}
            className="absolute z-20 focus:outline-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            style={{
              top: '25%', // Back-right position on the background
              right: '20%',
              width: '24%',
            }}
          >
            <img 
              src="https://ik.imagekit.io/o8kv1qv3h/3c48cc6a-2d05-47e9-8dbb-5e4337aff2b7.png" 
              alt="Barracks Complex" 
              className="w-full h-auto pointer-events-none"
            />
          </motion.button>

          {/* Building 1: Front-Left Building */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={showNotification}
            className="absolute z-30 focus:outline-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
            style={{
              top: '50%', // Front-left position on the background
              left: '12%',
              width: '38%',
            }}
          >
            <img 
              src="https://ik.imagekit.io/o8kv1qv3h/d5f7fefd-d843-4848-9faa-c1d302beaeae.png" 
              alt="Command Outpost" 
              className="w-full h-auto pointer-events-none"
            />
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
