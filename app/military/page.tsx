'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sword, Shield, Target, ShoppingBag, Trophy, Loader2, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function MilitaryCampPage() {
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ level: 1, exp: 0, attack: 100, defense: 100 });
  const [wheatBalance, setWheatBalance] = useState(0);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [gameScore, setGameScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  const SHOP_ITEMS = [
    { 
      id: 'knife', 
      name: 'Tactical Knife', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/knife.png', 
      cost: { iron: 1000 }, 
      effect: { attack: 0.1 }, 
      desc: '+10% Attack' 
    },
    { 
      id: 'gun', 
      name: 'Sidearm', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/gun.jpg', 
      cost: { iron: 10000 }, 
      effect: { attack: 0.3 }, 
      desc: '+30% Attack' 
    },
    { 
      id: 'akm', 
      name: 'AKM Rifle', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/pixel-art-smg-pixelated-short-machine-gun-smg-weapon-icons-background-pixelated-for-the-pixel-art-game-and-icon-for-website-and-video-game-old-school-retro-vector.jpg', 
      cost: { iron: 50000 }, 
      effect: { attack: 0.6 }, 
      desc: '+60% Attack' 
    },
    { 
      id: 'rpg', 
      name: 'RPG Launcher', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/pixel-art-bazooka-pixelated-bazooka-bazooka-rpg-weapon-icons-background-pixelated-for-the-pixel-art-game-and-icon-for-website-and-video-game-old-school-retro-vector.jpg', 
      cost: { iron: 100000 }, 
      effect: { attack: 1.0 }, 
      desc: '+100% Attack' 
    },
    { 
      id: 'armored_car', 
      name: 'Armored Scout', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/pixel-art-post-apocalyptic-armored-vehicle-vector.jpg', 
      cost: { iron: 100000, oil: 100000 }, 
      effect: { attack: 1.0, defense: 0.2 }, 
      desc: '+100% ATK | +20% DEF' 
    },
    { 
      id: 'tank', 
      name: 'Main Battle Tank', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/71gjtQkvUSL.png', 
      cost: { iron: 100000, oil: 150000 }, 
      effect: { attack: 1.0, defense: 0.4 }, 
      desc: '+100% ATK | +40% DEF' 
    },
    { 
      id: 'aircraft', 
      name: 'F-14 Interceptor', 
      image: 'https://ik.imagekit.io/o8kv1qv3h/f14_222_5.png', 
      cost: { ton: 5, iron: 200000, oil: 200000 }, 
      effect: { attack: 2.0, defense: 2.0 }, 
      desc: '+200% ATK | +200% DEF' 
    }
  ];

  const WHEAT_PER_SESSION = 50 + (stats.level - 1) * 10;

  const [balances, setBalances] = useState({ iron: 0, oil: 0, ton: 0 });

  useEffect(() => {
    async function initMilitary() {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;

      if (!user && process.env.NODE_ENV === 'development') {
        user = { id: 1492586846 }; // Mock dev user
      }

      if (user) {
        setTelegramId(user.id);
        
        // 1. Fetch Stats
        const { data: milData } = await supabase.from('military_stats').select('*').eq('telegram_id', user.id).maybeSingle();
        if (milData) setStats({ level: milData.level, exp: milData.exp, attack: milData.attack, defense: milData.defense });

        // 2. Fetch Resources
        const { data: resData } = await supabase.from('user_resources').select('wheat, iron, oil, ton_balance').eq('telegram_id', user.id).maybeSingle();
        if (resData) {
          setWheatBalance(resData.wheat);
          setBalances({ iron: resData.iron || 0, oil: resData.oil || 0, ton: resData.ton_balance || 0 });
        }

        // 3. Fetch Inventory
        const { data: invData } = await supabase.from('military_inventory').select('*').eq('telegram_id', user.id);
        if (invData) {
          const invMap: Record<string, number> = {};
          invData.forEach(item => invMap[item.item_id] = item.quantity);
          setInventory(invMap);
        }
      }
      setLoading(false);
    }
    initMilitary();
  }, []);

  const handlePurchase = async (item: any) => {
    if (!telegramId) return;

    // Check Balance
    if (item.cost.iron && balances.iron < item.cost.iron) return showNotification("Insufficient Iron!");
    if (item.cost.oil && balances.oil < item.cost.oil) return showNotification("Insufficient Oil!");
    if (item.cost.ton && balances.ton < item.cost.ton) return showNotification("Insufficient TON!");

    setLoading(true);
    try {
      // 1. Deduct Resources
      const { error: resError } = await supabase.from('user_resources').update({
        iron: balances.iron - (item.cost.iron || 0),
        oil: balances.oil - (item.cost.oil || 0),
        ton_balance: balances.ton - (item.cost.ton || 0)
      }).eq('telegram_id', telegramId);

      if (resError) throw resError;

      // 2. Update Inventory (Upsert)
      const currentQty = inventory[item.id] || 0;
      const { error: invError } = await supabase.from('military_inventory').upsert({
        telegram_id: telegramId,
        item_id: item.id,
        quantity: currentQty + 1
      }, { onConflict: 'telegram_id,item_id' });

      if (invError) throw invError;

      // 3. Update Military Stats (Cumulative Staking)
      // We calculate increase based on % of CURRENT stats as requested
      const atkInc = stats.attack * (item.effect.attack || 0);
      const defInc = stats.defense * (item.effect.defense || 0);

      const { data: newStats, error: statError } = await supabase.from('military_stats').update({
        attack: stats.attack + atkInc,
        defense: stats.defense + defInc
      }).eq('telegram_id', telegramId).select().single();

      if (statError) throw statError;

      // 4. Update Local State
      setBalances({
        iron: balances.iron - (item.cost.iron || 0),
        oil: balances.oil - (item.cost.oil || 0),
        ton: balances.ton - (item.cost.ton || 0)
      });
      setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      setStats({ ...stats, attack: newStats.attack, defense: newStats.defense });
      
      showNotification(`${item.name} purchased! Effects stacked.`);
    } catch (e: any) {
      console.error(e);
      showNotification("Purchase failed. System error.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const startTraining = () => {
    if (wheatBalance < WHEAT_PER_SESSION) {
      showNotification(`Insufficient Wheat! Need ${WHEAT_PER_SESSION} for one training session.`);
      return;
    }
    setIsTraining(true);
    setGameScore(0);
    setGameActive(true);
  };

  const completeTraining = async () => {
    if (!telegramId) return;

    const newExp = stats.exp + 1;
    let newLevel = stats.level;
    let newStats = { ...stats };

    if (newExp >= 10) {
      // LEVEL UP
      newLevel = stats.level + 1;
      newStats = {
        level: newLevel,
        exp: 0,
        attack: stats.attack + 25 + (newLevel * 5),
        defense: stats.defense + 20 + (newLevel * 3)
      };
      showNotification(`LEVEL UP! You reached Level ${newLevel}`);
    } else {
      newStats = { ...stats, exp: newExp };
      showNotification(`Training session ${newExp}/10 complete!`);
    }

    // Update DB
    const { error: milError } = await supabase
      .from('military_stats')
      .update({ 
        level: newStats.level, 
        exp: newStats.exp, 
        attack: newStats.attack, 
        defense: newStats.defense 
      })
      .eq('telegram_id', telegramId);

    // Update Resources
    const { error: resError } = await supabase
      .from('user_resources')
      .update({ wheat: wheatBalance - WHEAT_PER_SESSION })
      .eq('telegram_id', telegramId);

    if (!milError && !resError) {
      setStats(newStats);
      setWheatBalance(prev => prev - WHEAT_PER_SESSION);
    }
    
    setIsTraining(false);
    setGameActive(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col font-sans">
      <div className="absolute inset-0 z-0 bg-no-repeat bg-center bg-cover" style={{ backgroundImage: `url('https://ik.imagekit.io/o8kv1qv3h/ChatGPT%20Image%20May%208,%202026,%2006_02_51%20PM.png')`, backgroundAttachment: 'fixed' }} />

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

      <div className="relative flex-1 w-full max-w-md mx-auto z-10 px-6 pt-4 flex flex-col">
        
        {/* STATS OVERLAY */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-4">
          <div className="tech-card bg-black/60 border-red-500/30 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Military Strength Index</span>
              <span className="text-[9px] font-mono text-zinc-500">WHEAT: {wheatBalance.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Attack</span>
                  <span className="text-xl font-black italic text-white leading-none">{stats.attack}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (stats.attack / 5000) * 100)}%` }} className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Defense</span>
                  <span className="text-xl font-black italic text-white leading-none">{stats.defense}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (stats.defense / 5000) * 100)}%` }} className="h-full bg-accent-cyan shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="tech-card bg-black/60 border-accent-cyan/20 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-accent-cyan" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan">Imperial Rank</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">LVL {stats.level} / 100</span>
            </div>
            <div className="relative py-2">
              <div className="h-4 w-full bg-zinc-900 border border-white/5 p-0.5 rounded-sm">
                <motion.div animate={{ width: `${(stats.exp / 10) * 100}%` }} className="h-full bg-gradient-to-r from-accent-cyan/20 via-accent-cyan to-white/80 relative transition-all duration-500">
                  <div className="absolute top-0 right-0 h-full w-px bg-white shadow-[0_0_8px_white]" />
                </motion.div>
              </div>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[7px] font-mono text-zinc-600">Training sessions: {stats.exp}/10</span>
                <span className="text-[7px] font-mono text-zinc-600 italic">Cost: {WHEAT_PER_SESSION} Wheat</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* INTERACTIVE BUTTONS */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-12">
          <motion.button whileTap={{ scale: 0.95 }} onClick={startTraining} className="group relative h-24 bg-zinc-900/40 border border-white/10 hover:border-accent-cyan/50 transition-all rounded-lg overflow-hidden flex flex-col items-center justify-center gap-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <Target className="w-6 h-6 text-zinc-500 group-hover:text-accent-cyan transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-white">Training Range</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsShopOpen(true)} className="group relative h-24 bg-zinc-900/40 border border-white/10 hover:border-red-500/50 transition-all rounded-lg overflow-hidden flex flex-col items-center justify-center gap-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShoppingBag className="w-6 h-6 text-zinc-500 group-hover:text-red-500 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-white">The Shop</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </motion.button>
        </div>
      </div>

      {/* WEAPON SHOP MODAL */}
      <AnimatePresence>
        {isShopOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsShopOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-zinc-400" />
                </button>
                <div className="flex flex-col">
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Imperial Armory</h2>
                  <span className="text-[8px] font-mono text-zinc-500">EXCHANGE RATE: 1.0 SOVEREIGN</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-mono text-zinc-500 uppercase">Iron</span>
                   <span className="text-[10px] font-black text-white">{balances.iron.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-mono text-zinc-500 uppercase">Oil</span>
                   <span className="text-[10px] font-black text-white">{balances.oil.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SHOP_ITEMS.map((item) => (
                  <motion.div 
                    key={item.id}
                    className="tech-card border-white/5 bg-zinc-900/30 p-3 flex flex-col gap-2 relative group"
                  >
                    <div className="aspect-square rounded-lg bg-black/40 overflow-hidden relative">
                       <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded text-[7px] font-black uppercase text-accent-cyan">
                          {item.id === 'aircraft' ? 'LEGENDARY' : 'TACTICAL'}
                       </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-black uppercase text-white truncate">{item.name}</h3>
                      <p className="text-[9px] font-mono text-emerald-500">{item.desc}</p>
                    </div>

                    <div className="space-y-2 mt-auto pt-2 border-t border-white/5">
                       <div className="space-y-0.5">
                          {Object.entries(item.cost).map(([res, val]) => (
                            <div key={res} className="flex justify-between text-[8px] font-mono uppercase">
                               <span className="text-zinc-500">{res}:</span>
                               <span className={((balances as any)[res] || balances.ton) < (val as number) ? 'text-red-500' : 'text-white'}>
                                 {val.toLocaleString()}
                               </span>
                            </div>
                          ))}
                       </div>
                       
                       <button 
                         onClick={() => handlePurchase(item)}
                         className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded font-black text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white transition-all ring-1 ring-white/5"
                       >
                         Purchase
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* INVENTORY FOOTER ROW */}
            <div className="p-4 bg-zinc-950 border-t border-white/10">
               <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Arsenal Inventory</span>
                  <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
               </div>
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {SHOP_ITEMS.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0">
                       <div className={`w-14 h-14 rounded-lg bg-zinc-900 border ${inventory[item.id] ? 'border-accent-cyan/30' : 'border-white/5 opacity-40'} flex items-center justify-center p-1 overflow-hidden`}>
                          <img src={item.image} alt={item.id} className="w-full h-full object-cover rounded" />
                       </div>
                       <div className="absolute -top-1.5 -right-1.5 bg-black border border-white/10 rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white">x{inventory[item.id] || 0}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MINI-SHOOTING GAME MODAL */}
      <AnimatePresence>
        {isTraining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-6 pb-20 text-center">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black italic text-accent-cyan mb-1">TARGET PRACTICE</h2>
                <div className="flex items-center justify-center gap-4 text-zinc-500 font-mono text-[10px] uppercase">
                  <span>Targets Hit: {gameScore} / 5</span>
                  <span className="text-accent-cyan">|</span>
                  <span>Fee: {WHEAT_PER_SESSION} Wheat</span>
                </div>
              </div>

              <div className="aspect-square bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center">
                {gameActive ? (
                  <ShootingGame 
                    onScoreChange={(s) => setGameScore(s)}
                    onComplete={(score) => {
                      if (score >= 5) completeTraining();
                      else {
                        showNotification("Protocol Failed: Inaccurate fire. Need 5 hits.");
                        setIsTraining(false);
                      }
                    }} 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase animate-pulse">Initializing simulation...</span>
                  </div>
                )}
              </div>

              <button onClick={() => setIsTraining(false)} className="w-full py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                Abandon Exercise
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[400] w-[80%] max-w-xs">
            <div className="bg-zinc-900 border border-accent-cyan/30 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-cyan/10 rounded-lg"><Sword className="w-4 h-4 text-accent-cyan" /></div>
                <span className="text-[10px] font-black uppercase text-accent-cyan tracking-widest">Imperial Link</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShootingGame({ onComplete, onScoreChange }: { onComplete: (score: number) => void, onScoreChange: (s: number) => void }) {
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [timeLeft, setTimeLeft] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    moveTarget();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          onComplete(score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const moveTarget = () => {
    setTargetPos({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70
    });
  };

  const handleShot = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScore = score + 1;
    setScore(newScore);
    onScoreChange(newScore);
    if (newScore >= 5) {
      onComplete(newScore);
    } else {
      moveTarget();
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 cursor-crosshair">
      <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
         <span className="text-[9px] font-mono text-accent-cyan uppercase">Range Timer: {timeLeft}s</span>
         <div className="flex gap-1">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className={`w-3 h-1 ${i < score ? 'bg-red-500' : 'bg-zinc-800'}`} />
            ))}
         </div>
      </div>

      <motion.button
        key={`${targetPos.x}-${targetPos.y}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={handleShot}
        className="absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 group"
        style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
      >
        <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-25" />
        <div className="absolute inset-0 border-2 border-red-600 rounded-full flex items-center justify-center p-1">
           <div className="w-full h-full bg-red-600/20 rounded-full flex items-center justify-center border-4 border-red-600 group-active:bg-red-500">
              <div className="w-3 h-3 bg-red-600 rounded-full border border-black" />
           </div>
        </div>
      </motion.button>
    </div>
  );
}
