'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Home, Car, ShoppingBag, Map as MapIcon, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RealEstatePage() {
  const [notification, setNotification] = useState<string | null>(null);
  const [assets, setAssets] = useState<{ id: string, type: string, x: number, y: number, name: string, image: string }[]>([]);

  useEffect(() => {
    // Generate random positions for the assets to make it look scattered on the grass
    const assetTypes = [
      { type: 'house', name: 'Imperial Estate', image: 'https://ik.imagekit.io/trya1gkkd/dek1lf1-611eef51-14d6-4b95-a04e-a4049b4b5648.png' },
      { type: 'car', name: 'Executive Transport', image: 'https://ik.imagekit.io/trya1gkkd/00-final-product.png' },
      { type: 'shop', name: 'Regional Market', image: 'https://ik.imagekit.io/trya1gkkd/i2.png' }
    ];

    const generated = assetTypes.map((item, idx) => ({
      id: `${item.type}-${idx}`,
      ...item,
      x: 10 + Math.random() * 60, // Keep away from extreme edges
      y: 20 + Math.random() * 50
    }));

    setAssets(generated);
  }, []);

  const handleClick = (name: string) => {
    setNotification(`${name}: Acquisition protocols offline. Development in progress.`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-emerald-900 font-sans">
      {/* PIXEL ART GRASS BACKGROUND */}
      <div 
        className="absolute inset-0 z-0 opacity-100"
        style={{ 
          backgroundImage: `url('https://ik.imagekit.io/trya1gkkd/depositphotos_575075004-stock-illustration-grass-texture-pixel-art-vector.jpg')`,
          backgroundSize: '200px 200px',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* GRID OVERLAY FOR STYLE */}
      <div className="absolute inset-0 z-1 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* HEADER */}
      <div className="relative z-[100] p-4 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white">Land Registry</h1>
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Sector 09-A Real Estate</span>
            </div>
          </div>
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <span className="text-[10px] font-black text-emerald-400">AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* ASSETS LAYER */}
      <div className="relative w-full h-full max-w-md mx-auto z-10">
        {assets.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(asset.name)}
            className="absolute flex flex-col items-center cursor-pointer group"
            style={{ 
              left: `${asset.x}%`, 
              top: `${asset.y}%`,
              width: asset.type === 'shop' ? '120px' : asset.type === 'car' ? '80px' : '100px'
            }}
          >
            {/* Title Label */}
            <div className="mb-2 px-2 py-0.5 bg-black/80 border border-white/10 rounded-sm shadow-xl transition-all group-hover:bg-accent-cyan group-hover:border-white">
              <span className="text-[8px] font-black uppercase tracking-widest text-white group-hover:text-black whitespace-nowrap">
                {asset.name}
              </span>
            </div>

            {/* Asset Image */}
            <div className="relative">
              <img 
                src={asset.image} 
                alt={asset.name} 
                className="w-full h-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] group-hover:brightness-125 transition-all" 
                referrerPolicy="no-referrer"
              />
              {/* Ground Shadow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/40 rounded-[100%] blur-md z-[-1]" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* FOOTER LEGEND */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl flex items-center justify-around shadow-2xl">
          <div className="flex flex-col items-center gap-1 opacity-60">
            <Home className="w-3 h-3 text-white" />
            <span className="text-[7px] font-black uppercase text-white tracking-widest">Residential</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex flex-col items-center gap-1 opacity-60">
            <Car className="w-3 h-3 text-white" />
            <span className="text-[7px] font-black uppercase text-white tracking-widest">Transport</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex flex-col items-center gap-1 opacity-60">
            <ShoppingBag className="w-3 h-3 text-white" />
            <span className="text-[7px] font-black uppercase text-white tracking-widest">Commercial</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-x-0 bottom-24 flex justify-center z-[200] px-6"
          >
            <div className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-4">
               <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-emerald-500" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Land Hub Message</span>
                  <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                    {notification}
                  </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
