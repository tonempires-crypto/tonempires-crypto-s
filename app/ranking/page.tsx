'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Users, TrendingUp, Shield, Sword, Globe, Home, Loader2, Crown, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type RankingType = 'empire' | 'individual';
type EmpireSubTab = 'economic' | 'population' | 'military';
type IndividualSubTab = 'global' | 'internal';

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RankingType>('individual');
  const [empireSubTab, setEmpireSubTab] = useState<EmpireSubTab>('population');
  const [individualSubTab, setIndividualSubTab] = useState<IndividualSubTab>('global');
  const [individualSort, setIndividualSort] = useState<'military' | 'rank'>('military');

  const [rankings, setRankings] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [userEmpire, setUserEmpire] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;
      if (!user && process.env.NODE_ENV === 'development') user = { id: 1492586846 };

      if (user) {
        setTelegramId(user.id);
        const { data: uData } = await supabase.from('users').select('*').eq('telegram_id', user.id).maybeSingle();
        if (uData) {
          setUserData(uData);
          setUserEmpire(uData.empire_name);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    fetchRankings();
  }, [activeTab, empireSubTab, individualSubTab, individualSort, loading]);

  async function fetchRankings() {
    setLoading(true);
    try {
      if (activeTab === 'empire') {
        // Fetch Regions and Stats
        const { data: regions } = await supabase.from('regions').select('*');
        const { data: stats } = await supabase.from('regional_stats').select('*');

        if (empireSubTab === 'population') {
          const sorted = (regions || []).map(r => {
            const s = stats?.find(st => st.region === r.id);
            return { name: r.name, value: s?.population || 0 };
          }).sort((a, b) => b.value - a.value);
          setRankings(sorted);
        } else if (empireSubTab === 'economic') {
          const sorted = (regions || []).map(r => {
            const s = stats?.find(st => st.region === r.id);
            const pop = s?.population || 0;
            const circ = s?.total_circulation || 0;
            const ton = r.total_ton_deposited || 0;
            const rawPrice = ton > 0 ? circ / ton : 1;
            const basePrice = Math.max(1, rawPrice);
            const finalPrice = basePrice * pop * 0.01;
            return { name: r.name, value: finalPrice };
          }).sort((a, b) => b.value - a.value);
          setRankings(sorted);
        } else {
          setRankings([]); // Military Coming Soon
        }
      } else {
        // Individual
        // Optimization: Fetch all users and all stats, then join in memory
        const { data: users } = await supabase.from('users').select('username, telegram_id, rank, region, empire_name');
        const { data: milStats } = await supabase.from('military_stats').select('telegram_id, attack, defense');

        if (users) {
          const processed = users.map((u: any) => {
            const mil = milStats?.find(ms => ms.telegram_id === u.telegram_id) || { attack: 0, defense: 0 };
            return {
              username: u.username,
              telegramId: u.telegram_id,
              rank: parseInt(u.rank || '1'),
              militaryStrength: (mil.attack || 0) + (mil.defense || 0),
              empire: u.empire_name || u.region?.toUpperCase().replace('_', ' ') || 'UNALIGNED'
            };
          });

          let filtered = processed;
          if (individualSubTab === 'internal' && (userEmpire || userData?.region)) {
            const target = userEmpire || userData?.region?.toUpperCase().replace('_', ' ');
            filtered = processed.filter(u => u.empire === target);
          }

          const sorted = filtered.sort((a: any, b: any) => {
            if (individualSort === 'military') return b.militaryStrength - a.militaryStrength;
            return b.rank - a.rank;
          });
          setRankings(sorted);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const renderRankItem = (item: any, index: number) => {
    const isUser = item.telegramId === telegramId;
    const valueDisplay = activeTab === 'empire' 
      ? (empireSubTab === 'population' ? `${item.value.toLocaleString()} UNITS` : `RATE ${item.value.toFixed(4)}`)
      : (individualSort === 'military' ? item.militaryStrength.toLocaleString() : `RANK ${item.rank}`);
    
    const subtitleDisplay = activeTab === 'empire'
      ? (empireSubTab === 'population' ? 'ACTIVE POPULATION' : 'CURRENCY RATE')
      : (individualSort === 'military' ? 'TOTAL COMBAT POWER' : 'SOVEREIGN STATUS');

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.05, 1) }}
        key={`${activeTab}-${index}`}
        className={`relative flex items-center justify-between p-4 rounded-xl border mb-3 transition-all
          ${isUser ? 'bg-accent-cyan/10 border-accent-cyan/30 shadow-[0_0_15px_rgba(45,212,191,0.1)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-white/10 font-black italic text-xs">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white uppercase italic tracking-wider flex items-center gap-2">
              {activeTab === 'empire' ? item.name : (item.username || 'Citizen')}
              {isUser && <span className="text-[8px] bg-accent-cyan text-black px-1.5 rounded-full not-italic">YOU</span>}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-tight">
              {activeTab === 'empire' ? 'Strategic Sector' : item.empire}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-white italic">
            {valueDisplay}
          </span>
          <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest leading-none mt-1">
            {subtitleDisplay}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-cyan/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.03),transparent_70%)]" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-screen max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-right">
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">Imperial Registry</h1>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Synchronizing Rankings...</span>
          </div>
        </div>

        {/* Global Tabs */}
        <div className="flex gap-2 p-1 bg-zinc-900/80 border border-white/5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${activeTab === 'individual' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
          >
            <Users className="w-4 h-4" /> Individual
          </button>
          <button
            onClick={() => setActiveTab('empire')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${activeTab === 'empire' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
          >
            <Globe className="w-4 h-4" /> Empire
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="mb-6 overflow-x-auto">
          {activeTab === 'empire' ? (
            <div className="flex gap-4">
              {[
                { id: 'economic', label: 'Economic', icon: TrendingUp },
                { id: 'population', label: 'Population', icon: Users },
                { id: 'military', label: 'Military', icon: Sword, soon: true },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => !tab.soon && setEmpireSubTab(tab.id as EmpireSubTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                    ${empireSubTab === tab.id ? 'bg-accent-cyan border-white text-black' : 'bg-zinc-900/50 border-white/5 text-zinc-500'}
                    ${tab.soon ? 'opacity-40 cursor-not-allowed mb-0' : ''}`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label} {tab.soon && '(Soon)'}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setIndividualSubTab('global')}
                  className={`flex-1 py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all
                    ${individualSubTab === 'global' ? 'bg-accent-cyan border-white text-black' : 'bg-transparent border-white/10 text-zinc-500'}`}
                >
                  Global Strength
                </button>
                <button
                  onClick={() => setIndividualSubTab('internal')}
                  className={`flex-1 py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all
                    ${individualSubTab === 'internal' ? 'bg-accent-cyan border-white text-black shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'bg-transparent border-white/10 text-zinc-500'}`}
                >
                  Internal ({userEmpire || 'Sovereign'})
                </button>
              </div>
              <div className="flex gap-4 border-b border-white/5 pb-2">
                <button
                  onClick={() => setIndividualSort('military')}
                  className={`text-[9px] font-black flex items-center gap-2 uppercase tracking-wide transition-colors
                    ${individualSort === 'military' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <Sword className="w-3 h-3" /> By Military
                </button>
                <button
                  onClick={() => setIndividualSort('rank')}
                  className={`text-[9px] font-black flex items-center gap-2 uppercase tracking-wide transition-colors
                    ${individualSort === 'rank' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <Crown className="w-3 h-3" /> By Rank
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase animate-pulse">Calculating Hierarchy...</p>
            </div>
          ) : rankings.length > 0 ? (
            rankings.map((item, i) => renderRankItem(item, i))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
              <Zap className="w-8 h-8 text-zinc-800 mb-2" />
              <p className="text-[10px] font-mono text-zinc-600 uppercase">Registry record unavailable</p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="p-4 bg-accent-cyan shadow-[0_0_20px_rgba(45,212,191,0.3)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-black" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-black/60 uppercase leading-none">Your Status</span>
                <span className="text-xs font-black text-black uppercase tracking-tight italic">
                  {rankings.findIndex(r => r.telegramId === telegramId) + 1 || '--'} TH IN REGISTRY
                </span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-black/10" />
            <div className="text-right">
              <div className="text-[10px] font-black text-black">TOP TIERS</div>
              <div className="text-[7px] text-black/60 uppercase font-mono">Registry Phase 1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
