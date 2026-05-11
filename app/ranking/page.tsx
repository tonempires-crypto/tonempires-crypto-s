'use client';

import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Users, Shield, Sword, Loader2, Zap, Crown, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<any[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<any>(null);
  const [telegramId, setTelegramId] = useState<number | string | null>(null);

  useEffect(() => {
    async function init() {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;
      if (!user && process.env.NODE_ENV === 'development') user = { id: 1492586846 };

      if (user) {
        setTelegramId(user.id);
      }
      fetchCombatRanking(user?.id);
    }
    init();
  }, []);

  const getVipBonus = (points: number) => {
    if (points >= 240000) return { atk: 1.30, def: 1.20 };
    if (points >= 120000) return { atk: 1.20, def: 1.10 };
    if (points >= 64000) return { atk: 1.12, def: 1.04 };
    if (points >= 32000) return { atk: 1.08, def: 1.02 };
    if (points >= 16000) return { atk: 1.04, def: 1.01 };
    if (points >= 8000) return { atk: 1.03, def: 1.00 };
    if (points >= 6000) return { atk: 1.025, def: 1.00 };
    if (points >= 4000) return { atk: 1.02, def: 1.00 };
    if (points >= 2000) return { atk: 1.01, def: 1.00 };
    if (points >= 1000) return { atk: 1.005, def: 1.00 };
    return { atk: 1.00, def: 1.00 };
  };

  async function fetchCombatRanking(currentUserId?: number | string) {
    setLoading(true);
    try {
      // 1. Fetch Real Users (No fake accounts - must have username and region)
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('username, telegram_id, photo_url, region, referred_by')
        .not('username', 'is', null)
        .not('region', 'is', null);

      if (userError) throw userError;

      // 2. Fetch Military Stats
      const { data: milStats } = await supabase.from('military_stats').select('*');

      // 3. Fetch Resources (for VIP calculation)
      const { data: resData } = await supabase.from('user_resources').select('telegram_id, total_ton_deposited');

      if (!users) return;

      // 4. Calculate Referral counts for VIP points
      const referralMap: Record<string, number> = {};
      users.forEach(u => {
        if (u.referred_by) {
          referralMap[String(u.referred_by)] = (referralMap[String(u.referred_by)] || 0) + 1;
        }
      });

      // 5. Build Combined Ranking with Combat Power
      const processed = users.map(u => {
        const stats = milStats?.find(ms => String(ms.telegram_id) === String(u.telegram_id)) || { attack: 100, defense: 100 };
        const res = resData?.find(r => String(r.telegram_id) === String(u.telegram_id)) || { total_ton_deposited: 0 };
        
        const refCount = referralMap[String(u.telegram_id)] || 0;
        const vipPoints = (refCount * 100) + Math.floor((res.total_ton_deposited || 0) * 1000);
        const bonus = getVipBonus(vipPoints);

        const totalAtk = Math.floor((stats.attack || 100) * bonus.atk);
        const totalDef = Math.floor((stats.defense || 100) * bonus.def);
        const cp = totalAtk + totalDef;

        return {
          id: String(u.telegram_id),
          username: u.username.startsWith('@') ? u.username : `@${u.username}`,
          photoUrl: u.photo_url,
          region: u.region,
          cp: cp,
        };
      });

      // 6. Sort by Combat Power
      const sorted = processed.sort((a, b) => b.cp - a.cp);

      // 7. Find My Rank
      if (currentUserId) {
        const myIdx = sorted.findIndex(item => String(item.id) === String(currentUserId));
        if (myIdx !== -1) {
          setMyRankInfo({ ...sorted[myIdx], rankNum: myIdx + 1 });
        }
      }

      setRankings(sorted);
    } catch (e) {
      console.error("Combat Ranking Error:", e);
    } finally {
      setLoading(false);
    }
  }

  const renderRankItem = (item: any, index: number, isStickyUser = false) => {
    const isUser = String(item.id) === String(telegramId) && !isStickyUser;
    
    return (
      <motion.div
        key={`${item.id}-${isStickyUser ? 'sticky' : index}`}
        initial={isStickyUser ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isStickyUser ? 0 : Math.min(index * 0.05, 1) }}
        className={`flex items-center justify-between p-4 rounded-2xl border mb-3 relative overflow-hidden transition-all
          ${isUser ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-zinc-900/50 border-white/5'}
          ${isStickyUser ? 'bg-accent-cyan border-none !mb-0 shadow-[0_-10px_30px_rgba(45,212,191,0.2)]' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-black italic text-xs border
            ${index === 0 ? 'bg-yellow-500 border-yellow-400 text-black' : 
              index === 1 ? 'bg-zinc-300 border-zinc-200 text-black' :
              index === 2 ? 'bg-orange-600 border-orange-500 text-white' :
              'bg-black/40 border-white/10 text-zinc-400'}`}>
            {index + 1}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center relative">
              {item.photoUrl ? (
                <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-zinc-600" />
              )}
              {index === 0 && <Crown className="absolute -top-1 -left-1 w-4 h-4 text-yellow-500 fill-yellow-500 -rotate-12" />}
            </div>
            
            <div className="flex flex-col">
              <span className={`text-sm font-black uppercase tracking-tight italic flex items-center gap-2
                ${isStickyUser ? 'text-black' : 'text-white'}`}>
                {item.username}
                {isUser && <span className="text-[7px] bg-accent-cyan text-black px-1.5 py-0.5 rounded-full not-italic font-black">YOU</span>}
              </span>
              <span className={`text-[9px] font-mono uppercase tracking-tighter
                ${isStickyUser ? 'text-black/60' : 'text-zinc-500'}`}>
                {item.region?.replace('_', ' ') || 'UNALIGNED'} SECTOR
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <Sword className={`w-3 h-3 ${isStickyUser ? 'text-black/60' : 'text-accent-cyan'}`} />
            <span className={`text-sm font-black italic ${isStickyUser ? 'text-black' : 'text-white'}`}>
              {item.cp.toLocaleString()}
            </span>
          </div>
          <span className={`text-[8px] font-mono uppercase tracking-widest leading-none mt-1
            ${isStickyUser ? 'text-black/60' : 'text-zinc-500'}`}>
            Combat Power
          </span>
        </div>

        {/* Top 3 Glow */}
        {index < 3 && !isStickyUser && (
          <div className={`absolute top-0 right-0 w-24 h-full opacity-10 pointer-events-none blur-2xl
            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-zinc-300' : 'bg-orange-600'}`} 
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-accent-cyan selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-cyan/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(45,212,191,0.05),transparent_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-lg mx-auto">
        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <Link href="/" className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="text-right">
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">Imperial Power Grid</h1>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Strategic Combat Rankings</span>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase animate-pulse">Scanning Neural Network...</p>
            </div>
          ) : rankings.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent-cyan" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/80">Global Top 50</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase">
                  <Zap className="w-3 h-3" />
                  Live Sync
                </div>
              </div>
              
              {rankings.slice(0, 50).map((item, i) => renderRankItem(item, i))}
              
              {rankings.length > 50 && (
                <div className="py-8 flex flex-col items-center gap-2">
                   <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                   <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                   <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                   <span className="text-[8px] font-mono text-zinc-600 uppercase mt-2">Expansion Pending...</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/10 rounded-2xl bg-zinc-900/10">
              <Star className="w-8 h-8 text-zinc-800 mb-2" />
              <p className="text-[10px] font-mono text-zinc-600 uppercase">Registry Offline</p>
            </div>
          )}
        </div>

        {/* Sticky User Rank at Bottom */}
        {!loading && myRankInfo && (
          <div className="p-6 pt-0 bg-gradient-to-t from-black via-black to-transparent">
            {renderRankItem({ ...myRankInfo }, myRankInfo.rankNum - 1, true)}
          </div>
        )}
      </div>
    </div>
  );
}
