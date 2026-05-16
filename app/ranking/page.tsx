'use client';

import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Users, Shield, Sword, Loader2, Zap, Crown, Star, Globe, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function RankingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'individual' | 'empire'>('individual');
  const [empireSubMode, setEmpireSubMode] = useState<'population' | 'economy' | 'military'>('population');
  const [rankings, setRankings] = useState<any[]>([]);
  const [regionRankings, setRegionRankings] = useState<any[]>([]);
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
      fetchRankings(user?.id);
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

  async function fetchRankings(currentUserId?: number | string) {
    setLoading(true);
    try {
      // 1. Fetch Real Users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('username, telegram_id, photo_url, region, referred_by')
        .not('username', 'is', null)
        .not('region', 'is', null);

      if (userError) throw userError;

      // 2. Fetch Military Stats
      const { data: milStats } = await supabase.from('military_stats').select('*');

      // 3. Fetch Resources
      const { data: resData } = await supabase.from('user_resources').select('*');

      if (!users) return;

      // 4. Referral Map
      const referralMap: Record<string, number> = {};
      users.forEach(u => {
        if (u.referred_by) {
          referralMap[String(u.referred_by)] = (referralMap[String(u.referred_by)] || 0) + 1;
        }
      });

      // 5. Individual CP Calculation
      const individualData = users.map(u => {
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
          resources: res
        };
      });

      // 6. Empire (Regional) Calculation
      const { data: regionsInfo } = await supabase.from('regions').select('*');
      const { data: statsInfo } = await supabase.from('regional_stats').select('*');

      const empireList = ['MIDDLE_EAST', 'ASIA', 'AFRICA', 'EUROPE', 'EAST_ASIA'].map(id => {
        const lowerId = id.toLowerCase();
        const info = regionsInfo?.find(r => r.id?.toLowerCase() === lowerId) || {};
        const stats = statsInfo?.find(s => s.region?.toLowerCase() === lowerId) || {};
        
        // Accurate Population from the full user dataset
        const pop = users.filter(u => u.region?.toUpperCase() === id.toUpperCase()).length;
        
        // Accurate Economy - Currency Exchange Rate Formula (TON per 1 Local)
        // Rate = (Total TON Deposits / Total Circulation) * (Population * 0.01)
        const circ = stats.total_circulation || 0;
        const ton = info.total_ton_deposited || 0;
        const rawPrice = circ > 0 ? ton / circ : 0.001;
        const rate = rawPrice * pop * 0.01;

        return {
          id: id,
          population: pop,
          economy: rate || 0,
          military: 0 // Coming Soon
        };
      });

      setRegionRankings(empireList);

      // Individual Sort
      const sorted = individualData.sort((a, b) => b.cp - a.cp);
      if (currentUserId) {
        const myIdx = sorted.findIndex(item => String(item.id) === String(currentUserId));
        if (myIdx !== -1) {
          setMyRankInfo({ ...sorted[myIdx], rankNum: myIdx + 1 });
        }
      }
      setRankings(sorted);

    } catch (e) {
      console.error("Ranking Fetch Error:", e);
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
                {isUser && <span className="text-[7px] bg-accent-cyan text-black px-1.5 py-0.5 rounded-full not-italic font-black">{t('ranking.you')}</span>}
              </span>
              <span className={`text-[9px] font-mono uppercase tracking-tighter
                ${isStickyUser ? 'text-black/60' : 'text-zinc-500'}`}>
                {item.region?.replace('_', ' ') || 'UNALIGNED'} {t('ranking.sector')}
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
            {t('ranking.combat_power')}
          </span>
        </div>

        {index < 3 && !isStickyUser && (
          <div className={`absolute top-0 right-0 w-24 h-full opacity-10 pointer-events-none blur-2xl
            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-zinc-300' : 'bg-orange-600'}`} 
          />
        )}
      </motion.div>
    );
  };

  const renderRegionItem = (region: any, index: number) => {
    let metricValue: string | number = "";
    let metricLabel = "";
    let MetricIcon = Users;

    if (empireSubMode === 'population') {
      metricValue = region.population.toLocaleString();
      metricLabel = t('ranking.population');
      MetricIcon = Users;
    } else if (empireSubMode === 'economy') {
      metricValue = region.economy.toFixed(5);
      metricLabel = t('ranking.economy');
      MetricIcon = TrendingUp;
    } else if (empireSubMode === 'military') {
      metricValue = "???";
      metricLabel = t('ranking.military');
      MetricIcon = Shield;
    }

    return (
      <motion.div
        key={region.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl mb-4 relative overflow-hidden group"
      >
        {empireSubMode === 'military' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan/80 bg-black/80 px-4 py-2 rounded-full border border-accent-cyan/20">
              {t('ranking.coming_soon')}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border
              ${index === 0 ? 'bg-yellow-500 border-yellow-400 text-black' : 
                index === 1 ? 'bg-zinc-300 border-zinc-200 text-black' :
                index === 2 ? 'bg-orange-600 border-orange-500 text-white' :
                'bg-black/20 border-white/10 text-zinc-400'}`}>
              {index + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-2">
                {region.id.replace('_', ' ')}
                {index === 0 && <Crown className="w-3 h-3 text-yellow-500" />}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Users className={`w-2.5 h-2.5 ${empireSubMode === 'population' ? 'text-accent-cyan' : 'text-zinc-500'}`} />
                  <span className={`text-[10px] font-mono ${empireSubMode === 'population' ? 'text-white' : 'text-zinc-400'}`}>{region.population}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-2.5 h-2.5 ${empireSubMode === 'economy' ? 'text-accent-cyan' : 'text-zinc-500'}`} />
                  <span className={`text-[10px] font-mono ${empireSubMode === 'economy' ? 'text-white' : 'text-zinc-400'}`}>{region.economy.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <MetricIcon className="w-3 h-3 text-accent-cyan" />
              <span className="text-sm font-black italic text-white">
                {metricValue}
              </span>
            </div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest leading-none mt-1">{metricLabel}</span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5 + (index * 0.1), duration: 1 }}
            className={`h-full ${index === 0 ? 'bg-yellow-500' : 'bg-accent-cyan/40'}`} 
          />
        </div>

        {index < 3 && (
          <div className={`absolute top-0 right-0 w-32 h-full opacity-5 pointer-events-none blur-3xl
            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-zinc-300' : 'bg-orange-600'}`} 
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-cyan/5 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-lg mx-auto">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="text-right">
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">{t('ranking.title')}</h1>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">{t('ranking.subtitle')}</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-zinc-900 overflow-hidden flex p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveMode('individual')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${activeMode === 'individual' ? 'bg-accent-cyan text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5" />
              {t('ranking.players')}
            </button>
            <button 
              onClick={() => setActiveMode('empire')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${activeMode === 'empire' ? 'bg-accent-cyan text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              {t('ranking.empires')}
            </button>
          </div>

          {activeMode === 'empire' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4"
            >
              <button 
                onClick={() => setEmpireSubMode('population')}
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] transition-all border
                  ${empireSubMode === 'population' 
                    ? 'bg-white/10 border-accent-cyan text-accent-cyan' 
                    : 'bg-transparent border-white/5 text-zinc-500'}`}
              >
                {t('ranking.population')}
              </button>
              <button 
                onClick={() => setEmpireSubMode('economy')}
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] transition-all border
                  ${empireSubMode === 'economy' 
                    ? 'bg-white/10 border-accent-cyan text-accent-cyan' 
                    : 'bg-transparent border-white/5 text-zinc-500'}`}
              >
                {t('ranking.economy')}
              </button>
              <button 
                onClick={() => setEmpireSubMode('military')}
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] transition-all border
                  ${empireSubMode === 'military' 
                    ? 'bg-white/10 border-accent-cyan text-accent-cyan' 
                    : 'bg-transparent border-white/5 text-zinc-500'}`}
              >
                {t('ranking.military')}
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase animate-pulse">{t('ranking.syncing')}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent-cyan" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/80">
                    {activeMode === 'individual' ? t('ranking.top_50') : t('ranking.continental')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {t('ranking.live_sync')}
                </div>
              </div>

              {activeMode === 'individual' ? (
                rankings.slice(0, 50).map((item, i) => renderRankItem(item, i))
              ) : (
                [...regionRankings]
                  .sort((a, b) => {
                    if (empireSubMode === 'population') return b.population - a.population;
                    if (empireSubMode === 'economy') return b.economy - a.economy;
                    return 0; // military unsorted for now as it is coming soon
                  })
                  .map((region, i) => renderRegionItem(region, i))
              )}
            </>
          )}
        </div>

        {!loading && activeMode === 'individual' && myRankInfo && (
          <div className="p-6 pt-0 bg-gradient-to-t from-black via-black to-transparent absolute bottom-0 left-0 right-0 max-w-lg mx-auto">
            {renderRankItem({ ...myRankInfo }, myRankInfo.rankNum - 1, true)}
          </div>
        )}
      </div>
    </div>
  );
}

