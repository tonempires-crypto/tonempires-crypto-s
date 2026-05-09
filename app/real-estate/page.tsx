'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Home, Car, ShoppingBag, Map as MapIcon, Info, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const ASSET_CONFIG = {
  house: { 
    name: 'Imperial Estate', 
    cost: { iron: 1000000 }, 
    bonus: '+100% Extraction Rate',
    image: 'https://ik.imagekit.io/trya1gkkd/dek1lf1-611eef51-14d6-4b95-a04e-a4049b4b5648.png'
  },
  car: { 
    name: 'Executive Transport', 
    cost: { oil: 1000000 }, 
    bonus: '+100% Extraction Rate',
    image: 'https://ik.imagekit.io/trya1gkkd/00-final-product.png'
  },
  shop: { 
    name: 'Regional Market', 
    cost: { gold: 1000000 }, 
    bonus: 'Black Market Access',
    image: 'https://ik.imagekit.io/trya1gkkd/i2.png'
  }
};

export default function RealEstatePage() {
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [balances, setBalances] = useState({ iron: 0, oil: 0, gold: 0 });
  const [unlocked, setUnlocked] = useState({ house: false, car: false, shop: false });
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function init() {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;
      if (!user && process.env.NODE_ENV === 'development') user = { id: 1492586846 };

      if (user) {
        setTelegramId(user.id);
        
        // Fetch Balances
        const { data: resData } = await supabase.from('user_resources').select('iron, oil, gold').eq('telegram_id', user.id).maybeSingle();
        if (resData) setBalances({ iron: resData.iron || 0, oil: resData.oil || 0, gold: resData.gold || 0 });

        // Fetch Unlocks
        const { data: lockData } = await supabase.from('user_real_estate').select('*').eq('telegram_id', user.id).maybeSingle();
        if (lockData) {
          setUnlocked({ house: lockData.has_house, car: lockData.has_car, shop: lockData.has_shop });
        } else {
          // Initialize record if user exists but no real estate record yet
          const { data: userData } = await supabase.from('users').select('telegram_id').eq('telegram_id', user.id).maybeSingle();
          if (userData) {
            await supabase.from('user_real_estate').upsert({ telegram_id: user.id }, { onConflict: 'telegram_id' });
          }
        }
      }

      // Generate static positions
      const generated = [
        { id: 'house', ...ASSET_CONFIG.house, x: 20, y: 30 },
        { id: 'car', ...ASSET_CONFIG.car, x: 65, y: 45 },
        { id: 'shop', ...ASSET_CONFIG.shop, x: 40, y: 60 }
      ];
      setAssets(generated);
      setLoading(false);
    }
    init();
  }, []);

  const handleUnlock = async () => {
    if (!selectedAsset || !telegramId || processing) return;
    
    const { id, cost } = selectedAsset;
    const type = id as keyof typeof unlocked;
    
    // Check if already unlocked
    if (unlocked[type]) return;

    // Check Balance
    const resType = Object.keys(cost)[0] as keyof typeof balances;
    const price = (cost as any)[resType];
    if (balances[resType] < price) {
      setNotification(`Insufficient ${resType.toUpperCase()}! Need ${price.toLocaleString()}.`);
      return;
    }

    setProcessing(true);
    try {
      // 1. Deduct Resource
      const { error: resError } = await supabase.from('user_resources').update({
        [resType]: balances[resType] - price
      }).eq('telegram_id', telegramId);

      if (resError) throw resError;

      // 2. Update Real Estate status
      const colName = id === 'house' ? 'has_house' : id === 'car' ? 'has_car' : 'has_shop';
      const { error: lockError } = await supabase.from('user_real_estate').update({
        [colName]: true
      }).eq('telegram_id', telegramId);

      if (lockError) throw lockError;

      // 3. Success
      setBalances(prev => ({ ...prev, [resType]: prev[resType] - price }));
      setUnlocked(prev => ({ ...prev, [type]: true }));
      setSelectedAsset(null);
      setNotification(`${selectedAsset.name} Unlocked Successfully!`);
    } catch (e) {
      console.error(e);
      setNotification("Transaction failed. System error.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="h-screen bg-emerald-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-emerald-900 font-sans">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('https://ik.imagekit.io/trya1gkkd/depositphotos_575075004-stock-illustration-grass-texture-pixel-art-vector.jpg')`, backgroundSize: '200px 200px', imageRendering: 'pixelated' }} />
      <div className="absolute inset-0 z-1 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

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
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-zinc-400 uppercase">Status</span>
            <span className="text-[10px] font-black text-white">[{Object.values(unlocked).filter(Boolean).length}/3] OWNED</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-full max-w-md mx-auto z-10">
        {assets.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedAsset(asset)}
            className="absolute flex flex-col items-center cursor-pointer group"
            style={{ left: `${asset.x}%`, top: `${asset.y}%`, width: asset.id === 'shop' ? '120px' : asset.id === 'car' ? '80px' : '100px' }}
          >
            <div className={`mb-2 px-2 py-0.5 border rounded-sm shadow-xl transition-all flex items-center gap-1.5
              ${unlocked[asset.id as keyof typeof unlocked] ? 'bg-emerald-600 border-white' : 'bg-black/80 border-white/10'}`}>
              <span className="text-[8px] font-black uppercase tracking-widest text-white whitespace-nowrap">{asset.name}</span>
              {unlocked[asset.id as keyof typeof unlocked] ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <Lock className="w-2.5 h-2.5 text-zinc-500" />}
            </div>
            <div className="relative">
              <img src={asset.image} alt={asset.name} className={`w-full h-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] transition-all ${unlocked[asset.id as keyof typeof unlocked] ? 'brightness-110' : 'brightness-50 grayscale'}`} referrerPolicy="no-referrer" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/40 rounded-[100%] blur-md z-[-1]" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ASSET DETAILS MODAL */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Home className="w-20 h-20 text-white" /></div>
               
               <h3 className="text-xl font-black italic text-white uppercase mb-1">{selectedAsset.name}</h3>
               <p className="text-[10px] font-mono text-accent-cyan uppercase mb-6 tracking-widest">Asset Identification Protocol</p>
               
               <div className="aspect-video relative rounded-lg bg-black/40 border border-white/5 mb-6 flex items-center justify-center overflow-hidden">
                  <img src={selectedAsset.image} className="w-1/2 h-auto drop-shadow-2xl" />
               </div>

               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                     <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Strategic Bonus</span>
                     <span className="text-xs font-bold text-emerald-500">{selectedAsset.bonus}</span>
                  </div>
                  {!unlocked[selectedAsset.id as keyof typeof unlocked] && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                       <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Ownership Cost</span>
                       <span className="text-xs font-bold text-white uppercase">
                          {(Object.values(selectedAsset.cost)[0] as number).toLocaleString()} {Object.keys(selectedAsset.cost)[0]}
                       </span>
                    </div>
                  )}
               </div>

               {unlocked[selectedAsset.id as keyof typeof unlocked] ? (
                 <div className="w-full py-4 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Asset Authenticated & Active</span>
                 </div>
               ) : (
                 <div className="flex gap-3">
                   <button onClick={() => setSelectedAsset(null)} className="flex-1 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase text-zinc-500">Cancel</button>
                   <button 
                    disabled={processing}
                    onClick={handleUnlock}
                    className="flex-3 py-3 bg-accent-cyan text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {processing ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Initialize Acquisition'}
                   </button>
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-24 flex justify-center z-[300] px-6">
            <div className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-4">
               <div className="p-2 bg-emerald-500/10 rounded-lg"><Info className="w-4 h-4 text-emerald-500" /></div>
               <div className="flex flex-col"><span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Land Hub Message</span><p className="text-[10px] text-zinc-300 font-medium">{notification}</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
