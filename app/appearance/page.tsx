'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Shield, Sword, Trophy, Crown, Zap, Loader2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AppearancePage() {
  const [loading, setLoading] = useState(true);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ atk: 0, def: 0 });
  const [vipPoints, setVipPoints] = useState(0);
  const [selectedSkin, setSelectedSkin] = useState('man1');
  const [saving, setSaving] = useState(false);

  const skins = [
    { id: 'man1', label: 'MALE UNIT', video: 'https://ik.imagekit.io/trya1gkkd/man1.mp4' },
    { id: 'woman1', label: 'FEMALE UNIT', video: 'https://ik.imagekit.io/trya1gkkd/woman1.mp4' }
  ];

  useEffect(() => {
    async function fetchData() {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;
      if (!user && process.env.NODE_ENV === 'development') user = { id: 1492586846 };

      if (user) {
        setTelegramId(user.id);
        
        // 1. User & VIP
        const { data: uData } = await supabase.from('users').select('*').eq('telegram_id', user.id).maybeSingle();
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', user.id);
        const { data: resData } = await supabase.from('user_resources').select('total_ton_deposited').eq('telegram_id', user.id).maybeSingle();
        
        if (uData) {
          setUserData(uData);
          setSelectedSkin(uData.skin_id || 'man1');
        }
        
        setVipPoints(((count || 0) * 100) + Math.floor((resData?.total_ton_deposited || 0) * 1000));

        // 2. Stats
        const { data: milData } = await supabase.from('military_stats').select('attack, defense').eq('telegram_id', user.id).maybeSingle();
        if (milData) setStats({ atk: milData.attack, def: milData.defense });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const changeSkin = async (id: string) => {
    if (!telegramId || saving) return;
    setSaving(true);
    setSelectedSkin(id);
    try {
      await supabase.from('users').update({ skin_id: id }).eq('telegram_id', telegramId);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getVipLevel = (pts: number) => {
    if (pts >= 240000) return 10;
    if (pts >= 120000) return 9;
    if (pts >= 64000) return 8;
    if (pts >= 32000) return 7;
    if (pts >= 16000) return 6;
    if (pts >= 8000) return 5;
    if (pts >= 4000) return 3;
    if (pts >= 2000) return 2;
    if (pts >= 1000) return 1;
    return 0;
  };

  const currentVideo = skins.find(s => s.id === selectedSkin)?.video || skins[0].video;

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent-cyan animate-spin" /></div>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* BACKGROUND VIDEO LAYER */}
      <AnimatePresence mode="wait">
        <motion.video
          key={selectedSkin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
        >
          <source src={currentVideo} type="video/mp4" />
        </motion.video>
      </AnimatePresence>

      {/* OVERLAY FILTERS */}
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-black via-transparent to-black/60" />
      <div className="absolute inset-0 z-1 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40" />

      {/* UI LAYER */}
      <div className="relative z-10 w-full h-full flex flex-col p-6 pointer-events-none">
        {/* Header */}
        <div className="flex items-center justify-between pointer-events-auto">
          <Link href="/" className="p-2 bg-white/5 rounded-lg border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-right">
            <h1 className="text-[10px] font-black uppercase tracking-widest text-accent-cyan">Unit Appearance</h1>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Registry Status: Synchronized</span>
          </div>
        </div>

        {/* Skin Selector (Top) */}
        <div className="mt-8 flex justify-center gap-4 pointer-events-auto">
          {skins.map(skin => (
            <button
              key={skin.id}
              onClick={() => changeSkin(skin.id)}
              className={`px-4 py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all
                ${selectedSkin === skin.id ? 'bg-accent-cyan text-black border-white shadow-[0_0_15px_rgba(0,255,209,0.3)]' : 'bg-black/40 border-white/5 text-zinc-500'}`}
            >
              {skin.label}
            </button>
          ))}
        </div>

        {/* EQUIPMENT SLOTS (LEFT & RIGHT) */}
        <div className="mt-12 flex-1 flex justify-between items-center pointer-events-auto">
          {/* Left Side Slots */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={`l-${i}`} className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group cursor-pointer hover:border-accent-cyan transition-all">
                <Plus className="w-4 h-4 text-zinc-700 group-hover:text-accent-cyan transition-colors" />
              </div>
            ))}
          </div>

          {/* Right Side Slots */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={`r-${i}`} className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group cursor-pointer hover:border-accent-cyan transition-all">
                <Plus className="w-4 h-4 text-zinc-700 group-hover:text-accent-cyan transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM DATA HUD (CONCISE TECH STYLE) */}
        <div className="mt-auto pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              {/* Row 1 */}
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 flex items-center gap-1">
                  <User className="w-2 h-2" /> Identification
                </span>
                <span className="text-xs font-bold text-white uppercase italic">{userData?.username || 'ANONYMOUS'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 flex items-center gap-1">
                  <Crown className="w-2 h-2" /> Sovereign Rank
                </span>
                <span className="text-xs font-bold text-white uppercase italic">LVL {userData?.rank || '1'}</span>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 flex items-center gap-1">
                  <Trophy className="w-2 h-2" /> VIP Protocol
                </span>
                <span className="text-xs font-bold text-yellow-400 uppercase italic">Tier {getVipLevel(vipPoints)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 flex items-center gap-1">
                  <Zap className="w-2 h-2" /> Sector Authority
                </span>
                <span className="text-xs font-bold text-emerald-500 uppercase italic">{userData?.empire_name || 'UNITED SECTORS'}</span>
              </div>

              {/* Stats Row */}
              <div className="col-span-2 pt-4 mt-2 border-t border-white/5 flex justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                    <Sword className="w-3 h-3 text-red-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-zinc-500">Attack Force</span>
                    <span className="text-sm font-black text-red-500">{stats.atk.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <Shield className="w-3 h-3 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-zinc-500">Defense Grid</span>
                    <span className="text-sm font-black text-blue-500">{stats.def.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
