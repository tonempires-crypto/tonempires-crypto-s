'use client';

import { motion } from 'motion/react';
import { Wallet, Briefcase, Shield, Home, Sword, Zap, Hourglass, ShieldAlert, Loader2, ArrowRight, Car, ShoppingBag, Trophy } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ProfileSection({ userData, resources, miningRates, onClaimSuccess }: { userData: any, resources: any, miningRates: any, onClaimSuccess: (newResources: any) => void }) {
  const { t } = useTranslation();
  const walletAddress = useTonAddress();
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Sync wallet address to DB
  const [manualWallet, setManualWallet] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [realEstate, setRealEstate] = useState({ house: false, car: false, shop: false });
  const [loadingEstate, setLoadingEstate] = useState(true);
  const [vipPoints, setVipPoints] = useState(0);

  // VIP Level Definitions
  const VIP_LEVELS = useMemo(() => [
    { level: 0, min: 0, name: t('profile.basic_citizen'), color: 'text-zinc-500', bg: 'bg-zinc-500', privileges: ['No active bonuses'], atk: 1.0, def: 1.0 },
    { level: 1, min: 1000, name: `${t('profile.tier')} 1`, color: 'text-emerald-400', bg: 'bg-emerald-400', privileges: ['Attack +0.5%'], atk: 1.005, def: 1.0 },
    { level: 2, min: 2000, name: `${t('profile.tier')} 2`, color: 'text-emerald-400', bg: 'bg-emerald-400', privileges: ['Attack +1%'], atk: 1.01, def: 1.0 },
    { level: 3, min: 4000, name: `${t('profile.tier')} 3`, color: 'text-emerald-500', bg: 'bg-emerald-500', privileges: ['Attack +2%'], atk: 1.02, def: 1.0 },
    { level: 4, min: 6000, name: `${t('profile.tier')} 4`, color: 'text-blue-400', bg: 'bg-blue-400', privileges: ['Attack +2.5%'], atk: 1.025, def: 1.0 },
    { level: 5, min: 8000, name: `${t('profile.tier')} 5`, color: 'text-blue-500', bg: 'bg-blue-500', privileges: ['Attack +3%'], atk: 1.03, def: 1.0 },
    { level: 6, min: 16000, name: `${t('profile.tier')} 6`, color: 'text-blue-600', bg: 'bg-blue-600', privileges: ['Attack +4%', 'Defense +1%'], atk: 1.04, def: 1.01 },
    { level: 7, min: 32000, name: `${t('profile.tier')} 7`, color: 'text-red-500', bg: 'bg-red-500', privileges: ['Attack +8%', 'Defense +2%'], atk: 1.08, def: 1.02 },
    { level: 8, min: 64000, name: `${t('profile.tier')} 8`, color: 'text-red-600', bg: 'bg-red-600', privileges: ['Attack +12%', 'Defense +4%'], atk: 1.12, def: 1.04 },
    { level: 9, min: 120000, name: `${t('profile.tier')} 9`, color: 'text-yellow-400', bg: 'bg-yellow-400', privileges: ['Attack +20%', 'Defense +10%'], atk: 1.20, def: 1.10 },
    { level: 10, min: 240000, name: `${t('profile.tier')} 10`, color: 'text-yellow-500', bg: 'bg-yellow-500', privileges: ['Attack +30%', 'Defense +20%'], atk: 1.30, def: 1.20 }
  ], [t]);

  const getVipInfo = (points: number) => {
    let currentVip = VIP_LEVELS[0];
    let nextVip = VIP_LEVELS[1];
    
    for (let i = 0; i < VIP_LEVELS.length; i++) {
      if (points >= VIP_LEVELS[i].min) {
        currentVip = VIP_LEVELS[i];
        nextVip = VIP_LEVELS[i + 1] || VIP_LEVELS[i];
      } else {
        break;
      }
    }
    
    const progressToNext = nextVip.level === currentVip.level 
      ? 100 
      : ((points - currentVip.min) / (nextVip.min - currentVip.min)) * 100;

    return { current: currentVip, next: nextVip, progress: progressToNext };
  };

  const vipInfo = getVipInfo(vipPoints);

  // RANK DEFINITIONS (1-100)
  const getRankData = (level: number) => {
    // Progression cost formula: Base 200, +15% per level, capped at reasonable growth
    const goldCost = Math.floor(200 * Math.pow(1.15, level - 1));
    
    let title = t('profile.titles.citizen');
    if (level >= 100) title = t('profile.titles.mighty_boss');
    else if (level >= 95) title = t('profile.titles.grand_emperor');
    else if (level >= 90) title = t('profile.titles.sovereign');
    else if (level >= 80) title = t('profile.titles.regent');
    else if (level >= 70) title = t('profile.titles.commandant');
    else if (level >= 60) title = t('profile.titles.governor');
    else if (level >= 50) title = t('profile.titles.proconsul');
    else if (level >= 40) title = t('profile.titles.magistrate');
    else if (level >= 30) title = t('profile.titles.director');
    else if (level >= 25) title = t('profile.titles.executive');
    else if (level >= 20) title = t('profile.titles.elite');
    else if (level >= 15) title = t('profile.titles.specialist');
    else if (level >= 10) title = t('profile.titles.apprentice');
    else if (level >= 5) title = t('profile.titles.resident');
    else if (level >= 2) title = t('profile.titles.new_citizen');

    return { title, goldCost };
  };

  const currentLevel = parseInt(userData?.rank || '1');
  const nextRank = getRankData(currentLevel + 1);

  const handleRankPromotion = async () => {
    if (currentLevel >= 100) return;
    if (resources.gold < nextRank.goldCost) {
      alert(`Insufficient Gold! Need ${nextRank.goldCost.toLocaleString()} Gold for Level ${currentLevel + 1}`);
      return;
    }

    setPromoting(true);
    try {
      // 1. Deduct Gold
      const { error: resError } = await supabase
        .from('user_resources')
        .update({ gold: resources.gold - nextRank.goldCost })
        .eq('telegram_id', userData.telegram_id);

      if (resError) throw resError;

      // 2. Update Rank (Level)
      const { error: userError } = await supabase
        .from('users')
        .update({ rank: (currentLevel + 1).toString() })
        .eq('telegram_id', userData.telegram_id);

      if (userError) throw userError;
      
      alert(`RANK UP! You are now Level ${currentLevel + 1}: ${nextRank.title.toUpperCase()}`);
      onClaimSuccess({ ...resources, gold: resources.gold - nextRank.goldCost });
      // We force a localized state update or refresh if needed
      window.location.reload(); 
    } catch (e) {
      console.error(e);
      alert("Promotion failed. System link unstable.");
    } finally {
      setPromoting(false);
    }
  };

  useEffect(() => {
    const syncWallet = async () => {
      if (walletAddress && userData?.telegram_id) {
        await supabase
          .from('users')
          .update({ wallet_address: walletAddress })
          .eq('telegram_id', userData.telegram_id);
      }
    };
    syncWallet();
  }, [walletAddress, userData?.telegram_id]);

  const saveManualWallet = async () => {
    if (!manualWallet.startsWith('EQ') && !manualWallet.startsWith('UQ')) {
      alert(t('profile.invalid_wallet'));
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ wallet_address: manualWallet })
      .eq('telegram_id', userData.telegram_id);
    
    if (!error) {
      alert(t('profile.manual_success'));
      setShowManual(false);
    } else {
      alert(t('profile.manual_fail') + ": " + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!userData?.telegram_id) return;
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', userData.telegram_id);
      setReferralCount(count || 0);
    };
    fetchReferrals();
  }, [userData]);

  useEffect(() => {
    const fetchVipPoints = async () => {
      if (!userData?.telegram_id) return;
      // Points = 100 per referral + 1000 per TON deposited
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', userData.telegram_id);
      const { data: resData } = await supabase.from('user_resources').select('total_ton_deposited').eq('telegram_id', userData.telegram_id).maybeSingle();
      
      const refs = count || 0;
      const deposits = resData?.total_ton_deposited || 0;
      setVipPoints((refs * 100) + Math.floor(deposits * 1000));
    };
    fetchVipPoints();
  }, [userData]);

  useEffect(() => {
    async function fetchRealEstate() {
      if (userData?.telegram_id) {
        const { data } = await supabase.from('user_real_estate').select('*').eq('telegram_id', userData.telegram_id).maybeSingle();
        if (data) {
          setRealEstate({ house: data.has_house, car: data.has_car, shop: data.has_shop });
        }
        setLoadingEstate(false);
      }
    }
    fetchRealEstate();
  }, [userData]);

  // Handle cooldown timer
  useEffect(() => {
    if (!userData?.last_claim) return;
    const interval = setInterval(() => {
      const last = new Date(userData.last_claim).getTime();
      const now = new Date().getTime();
      const diff = 3600000 - (now - last); // 1 hour in ms
      setTimeLeft(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [userData?.last_claim]);

  const handleMine = async () => {
    if (loading || timeLeft > 0) return;
    setLoading(true);

    const boost = 1 + (referralCount * 0.05);
    const estateMultiplier = 1 + (realEstate.house ? 1 : 0) + (realEstate.car ? 1 : 0);
    const totalYield = 10 * boost * estateMultiplier; 
    const taxDeduction = totalYield * 0.20;
    const userNetYield = totalYield - taxDeduction;

    const newResources = {
      ...resources,
      localCurrency: (resources.localCurrency || 0) + userNetYield
    };

    try {
      // Ensure we use the exact ID format (lowercase, no spaces) to match regions table
      const targetRegion = (userData.region || 'middle_east').toLowerCase().trim();
      
      // Calculate clean decimal values for the DB
      const netBalance = parseFloat(newResources.localCurrency.toFixed(5));
      const taxAmount = parseFloat(taxDeduction.toFixed(5));

      // 1. Core RPC Claim (The only way to bypass RLS for the treasury)
      const { error: rpcError } = await supabase.rpc('claim_mining_with_tax', {
        p_telegram_id: userData.telegram_id,
        p_net_currency: netBalance,
        p_tax_amount: taxAmount,
        p_region_id: targetRegion
      });

      if (rpcError) {
        console.error("RPC Tax Claim Failed:", rpcError);
        
        // Fallback: Update user balance only (Treasury will fail unless RPC works)
        const { error: userError } = await supabase
          .from('users')
          .update({
            local_currency_balance: netBalance,
            last_claim: new Date().toISOString()
          })
          .eq('telegram_id', userData.telegram_id);

        if (userError) throw userError;
        console.warn("Manual balance update succeeded, but Treasury update failed. Verify SQL Function exists.");
      } else {
        console.log(`CLAIM SUCCESS: User +${userNetYield.toFixed(2)} | Treasury +${taxAmount.toFixed(2)} (${targetRegion})`);
      }

      onClaimSuccess(newResources);
    } catch (err) {
      console.error("Mining Sync Failure:", err);
      alert("Mining Interrupted: Connection to Imperial Treasury unstable.");
    }
    setLoading(false);
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const boost = referralCount * 0.05;
  const baseRate = 10;
  // Real Estate Bonus: Each (House and Car) gives +100% (total additive stacking of bonuses)
  const estateMultiplier = 1 + (realEstate.house ? 1 : 0) + (realEstate.car ? 1 : 0);
  const boostedMining = baseRate * (1 + boost) * estateMultiplier;

  const getRegionalCurrency = (region: string) => {
    switch (region) {
      case 'middle_east': return { name: t('regions.middle_east'), code: 'BTM', color: 'text-accent-cyan' };
      case 'africa': return { name: t('regions.africa'), code: 'BTF', color: 'text-amber-500' };
      case 'europe': return { name: t('regions.europe'), code: 'BTE', color: 'text-blue-500' };
      case 'asia': return { name: t('regions.asia'), code: 'BTA', color: 'text-red-500' };
      case 'east_asia': return { name: t('regions.east_asia'), code: 'BTR', color: 'text-purple-500' };
      default: return { name: t('regions.neutral'), code: 'BTX', color: 'text-zinc-500' };
    }
  };

  const regionalCurrency = getRegionalCurrency(userData?.region || '');

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 text-center mt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border-[3px] border-zinc-800 flex items-center justify-center text-4xl font-black text-black transition-all duration-500 overflow-hidden">
            {userData?.photo_url ? (
              <img 
                src={userData.photo_url} 
                alt="" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // Fallback if image fails to load (e.g. expired Telegram link)
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-tr', 'from-accent-cyan', 'to-accent-blue');
                  const span = document.createElement('span');
                  span.className = 'text-black';
                  span.innerText = userData?.username?.slice(0, 2).toUpperCase() || '??';
                  (e.target as HTMLImageElement).parentElement!.appendChild(span);
                }}
              />
            ) : (
              <span className="text-accent-cyan">{userData?.username?.slice(0, 2).toUpperCase() || '??'}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-accent-cyan text-black text-[9px] font-black px-2 py-0.5 rounded border border-black uppercase rotate-3">
            LVL {currentLevel}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/appearance">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase text-zinc-400 hover:text-white transition-colors flex items-center gap-1 mx-auto"
            >
              <Zap className="w-2.5 h-2.5 text-accent-cyan" /> {t('profile.appearance')}
            </motion.button>
          </Link>
          <h2 className="text-2xl font-black tracking-tight">
            {userData?.username 
              ? (userData.username.startsWith('@') ? userData.username : `@${userData.username}`) 
              : t('profile.titles.citizen')}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1 mb-2">
            <span className="px-3 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-black uppercase text-accent-cyan tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              {getRankData(currentLevel).title}
            </span>
          </div>

          {/* NEW VIP PROGRESS BAR SECTION */}
          <div className="w-full max-w-[280px] mx-auto space-y-3 mt-2">
             <div className="flex justify-between items-end">
               <div className="flex flex-col items-start">
                 <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{t('profile.vip_level')}</span>
                 <span className={`text-xs font-black uppercase italic ${vipInfo.current.color}`}>
                   {vipInfo.current.name} ({t('profile.level')} {vipInfo.current.level})
                 </span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{t('profile.points')}</span>
                 <span className="text-xs font-black text-white">{vipPoints.toLocaleString()} <span className="text-[8px] text-zinc-500">{t('profile.points')}</span></span>
               </div>
             </div>

             {/* Progress Bar */}
             <div className="h-1.5 w-full bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${vipInfo.progress}%` }}
                 className={`h-full ${vipInfo.current.bg} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
               />
             </div>
             
             {vipInfo.current.level < 10 && (
               <div className="flex justify-between text-[7px] font-mono text-zinc-500 uppercase tracking-tighter">
                 <span>{t('profile.level')} {vipInfo.current.level}</span>
                 <span>{vipPoints.toLocaleString()} / {vipInfo.next.min.toLocaleString()} {t('profile.level')} {vipInfo.next.level}</span>
               </div>
             )}

             {/* Privileges Display */}
             <div className="grid grid-cols-2 gap-2 mt-4 text-left">
               <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                 <span className="text-[7px] font-black text-zinc-500 uppercase block mb-1">{t('profile.current_perks')}</span>
                 <ul className="space-y-0.5">
                   {vipInfo.current.privileges.map((p, i) => (
                     <li key={i} className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                       {p.includes('ATK') || p.includes('DEF') ? <Sword className="w-2 h-2 shrink-0" /> : <Shield className="w-2 h-2 shrink-0" />} {p}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                 <span className="text-[7px] font-black text-zinc-500 uppercase block mb-1">{t('profile.next_level_bonus')}</span>
                 <ul className="space-y-0.5">
                   {vipInfo.next.privileges.map((p, i) => (
                     <li key={i} className="text-[8px] font-bold text-zinc-400 flex items-center gap-1 italic">
                       <ArrowRight className="w-2 h-2 shrink-0" /> {p}
                     </li>
                   ))}
                 </ul>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Sovereign Wealth Section */}
      <div className="tech-card border-accent-orange/40 bg-accent-orange/5 p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t('profile.sovereign_wealth')}</span>
            <span className={`text-2xl font-black ${regionalCurrency.color || 'text-white'}`}>{resources.localCurrency?.toLocaleString() || '0.00'} {regionalCurrency.code}</span>
          </div>
          <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-[9px] font-mono text-zinc-400">
            {regionalCurrency.name}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
          <Zap className="w-3 h-3 text-accent-orange" />
          {t('profile.mining_for_empire', { code: regionalCurrency.code, empire: (userData?.region || 'Imperial').replace('_', ' ').toUpperCase() })}
        </div>
      </div>

      {/* Rank Promotion Progress (Gold Only) */}
      {currentLevel < 100 && (
        <div className="tech-card border-orange-500/30 bg-orange-500/5 p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{t('profile.rank_advancement')}</span>
              <span className="text-sm font-bold text-white uppercase italic">{t('profile.next')}: {nextRank.title}</span>
            </div>
            <button 
              onClick={handleRankPromotion}
              disabled={promoting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-95 transition-all disabled:opacity-50"
            >
              {promoting ? t('industry.processing') : t('profile.request_promotion')}
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
              <span>{t('profile.req_gold')}</span>
              <span className={resources.gold >= nextRank.goldCost ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                {resources.gold.toLocaleString()} / {nextRank.goldCost.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (resources.gold / nextRank.goldCost) * 100)}%` }}
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-zinc-400 font-mono italic">
                {t('profile.rank_permits', { units: currentLevel })}
              </p>
            </div>
            {currentLevel < 20 && (
              <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tight">
                {t('profile.political_unlock')}
              </p>
            )}
            {currentLevel >= 20 && (
              <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-tight flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" /> {t('profile.political_verified')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Military Command Access (Moved) */}
      <Link href="/military">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="tech-card bg-gradient-to-r from-red-900/40 to-black border-red-500/30 p-4 flex items-center justify-between group cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.1)]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
              <Sword className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-none mb-1">{t('profile.strategic_command')}</span>
              <span className="text-sm font-bold text-white uppercase">{t('profile.go_to_military')}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full border border-red-500/20 flex items-center justify-center group-hover:border-red-500/40 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 group-hover:animate-ping" />
          </div>
        </motion.div>
      </Link>

      {/* Hourly Mining Button - Redesigned to be Circular with Honeycomb Animation */}
      <div className="flex flex-col items-center justify-center p-6 tech-card border-zinc-800/10 bg-black/20">
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] block mb-2">{t('profile.extraction_core')}</span>
          <div className="text-sm font-bold text-white uppercase italic tracking-widest opacity-60">
            {userData?.region?.replace('_', ' ') || t('gov.sync')}
          </div>
        </div>

        <div className="relative group">
          {/* Honeycomb Pattern Decorative Ring */}
          <div className="absolute inset-[-15px] border border-accent-cyan/10 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-[-10px] border border-accent-cyan/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
          
          {/* Honeycomb SVG Background for animation */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-full opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
            <svg viewBox="0 0 100 100" className={`w-full h-full fill-accent-cyan ${timeLeft > 0 ? 'opacity-10' : 'animate-pulse'}`}>
              <pattern id="honeycomb" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" />
              </pattern>
              <rect width="100" height="100" fill="url(#honeycomb)" />
            </svg>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleMine}
            disabled={loading || timeLeft > 0}
            className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center p-4 transition-all duration-700 overflow-hidden border-4
              ${timeLeft > 0 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-600 grayscale' 
                : 'bg-black border-accent-cyan shadow-[0_0_40px_rgba(0,255,209,0.2)] text-white hover:shadow-[0_0_60px_rgba(0,255,209,0.4)]'}`}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            ) : timeLeft > 0 ? (
              <>
                <Hourglass className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-[14px] font-black font-mono">{formatTime(timeLeft)}</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-50">{t('profile.cooldown')}</span>
              </>
            ) : (
              <>
                <Zap className="w-8 h-8 text-accent-cyan mb-2 group-hover:animate-bounce" />
                <span className="text-[12px] font-black uppercase tracking-tighter text-center">{t('profile.execute_mining')}</span>
              </>
            )}

            {/* Mining Animation Overlays */}
            {timeLeft > 0 && (
              <motion.div 
                initial={{ height: "100%" }}
                animate={{ height: "0%" }}
                transition={{ duration: 3600, ease: "linear" }}
                className="absolute bottom-0 left-0 w-full bg-accent-cyan/10 z-[-1]"
              />
            )}
          </motion.button>
        </div>

        <div className="mt-8 text-center max-w-[200px]">
          <p className="text-[9px] font-mono text-zinc-500 uppercase leading-relaxed tracking-wider">
            Current Yield: <span className="text-white">{boostedMining.toFixed(2)} {regionalCurrency.code}/HR</span>
          </p>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="tech-card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t('profile.treasury_link')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <TonConnectButton className="w-full" />
          
          <div className="h-px bg-white/5 my-1" />
          
          {showManual ? (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <input 
                type="text" 
                placeholder="Paste TON Wallet Address (EQ...)"
                value={manualWallet}
                onChange={(e) => setManualWallet(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-white focus:border-blue-500 outline-none"
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveManualWallet}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-3 rounded-xl hover:bg-blue-500 transition-all uppercase tracking-widest"
                >
                  {t('nav.trade')}
                </button>
                <button 
                  onClick={() => setShowManual(false)}
                  className="px-4 bg-zinc-800 text-zinc-400 text-[10px] font-bold py-3 rounded-xl"
                >
                  {t('trade.recall')}
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowManual(true)}
              className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              {t('profile.link_manually')}
            </button>
          )}

          {(walletAddress || userData?.wallet_address) && (
            <div className="text-[10px] font-mono text-cyan-400 truncate bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/20 flex flex-col gap-1">
              <span className="text-zinc-500 text-[8px] uppercase">{t('profile.linked_wallet')}</span>
              {walletAddress || userData?.wallet_address}
            </div>
          )}
        </div>
      </div>

      {/* Mining & Economy Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 space-y-2 border-accent-cyan/20">
          <div className="flex justify-between items-start">
            <Hourglass className="w-4 h-4 text-accent-cyan" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase">{t('profile.production')}</span>
          </div>
          <div className="text-xl font-black text-white">{boostedMining.toFixed(2)}/hr</div>
          <p className="text-[8px] text-zinc-500 leading-tight">{t('profile.referral_boost', { boost: (boost * 100).toFixed(0) })}</p>
        </div>
        
        <div className="bento-card p-4 space-y-2 border-accent-orange/20">
          <div className="flex justify-between items-start">
            <Briefcase className="w-4 h-4 text-accent-orange" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase">{t('profile.employment')}</span>
          </div>
          <div className="text-sm font-bold text-white uppercase italic">
            {(userData?.region || t('regions.neutral')).replace('_', ' ')} {t('profile.enterprise')}
          </div>
          <p className="text-[8px] text-zinc-500 leading-tight">{t('profile.sector_active')}</p>
        </div>
      </div>

      {/* Ranking Section */}
      <div className="mx-0 flex justify-center">
        <Link href="/ranking" className="w-full">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center gap-3 group hover:bg-zinc-800 transition-all shadow-xl shadow-black/50"
          >
            <Trophy className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{t('profile.imperial_ranking')}</span>
          </motion.button>
        </Link>
      </div>

      {/* Property Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-zinc-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('profile.real_estate')}</h3>
          </div>
          <Link href="/real-estate">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
              {t('profile.enter_map')} <ArrowRight className="w-3 h-3" />
            </motion.button>
          </Link>
        </div>
        
        {loadingEstate ? (
          <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 flex justify-center">
             <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
          </div>
        ) : !realEstate.house && !realEstate.car && !realEstate.shop ? (
          <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 text-center cursor-pointer hover:bg-white/5 transition-all group" onClick={() => window.location.href = '/real-estate'}>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter group-hover:text-white transition-colors">{t('profile.no_properties')}</p>
          </div>
        ) : (
          <div className="tech-card border-zinc-800/50 bg-black/20 p-4">
            <div className="flex items-center justify-around gap-2">
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.house ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Home className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">{t('profile.estate')}</span>
               </div>
               <div className="w-[1px] h-8 bg-white/5" />
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.car ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Car className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">{t('profile.transport')}</span>
               </div>
               <div className="w-[1px] h-8 bg-white/5" />
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.shop ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">{t('profile.market_asset')}</span>
               </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
