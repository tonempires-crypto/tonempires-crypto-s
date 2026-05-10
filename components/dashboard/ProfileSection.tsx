'use client';

import { motion } from 'motion/react';
import { Wallet, Briefcase, Shield, Home, Sword, Zap, Hourglass, ShieldAlert, Loader2, ArrowRight, Car, ShoppingBag, Trophy } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProfileSection({ userData, resources, miningRates, onClaimSuccess }: { userData: any, resources: any, miningRates: any, onClaimSuccess: (newResources: any) => void }) {
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

  // VIP Logic
  const getVipData = (points: number) => {
    if (points >= 240000) return { level: 10, border: 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]', atk: 30, def: 20, name: 'Luxurious Gold' };
    if (points >= 120000) return { level: 9, border: 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]', atk: 20, def: 10, name: 'Elite Red' };
    if (points >= 64000) return { level: 8, border: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]', atk: 12, def: 4, name: 'Advanced Red' };
    if (points >= 32000) return { level: 7, border: 'border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]', atk: 8, def: 2, name: 'Sovereign Blue' };
    if (points >= 16000) return { level: 6, border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]', atk: 4, def: 1, name: 'Executive Blue' };
    if (points >= 8000) return { level: 5, border: 'border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]', atk: 3, def: 0, name: 'Blue Initiate' };
    if (points >= 4000) return { level: 3, border: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]', atk: 2, def: 0, name: 'Noble Green' };
    if (points >= 2000) return { level: 2, border: 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]', atk: 1, def: 0, name: 'Green Elite' };
    if (points >= 1000) return { level: 1, border: 'border-emerald-400', atk: 0, def: 0, name: 'Green Member' };
    return { level: 0, border: 'border-accent-cyan/30', atk: 0, def: 0, name: 'No VIP' };
  };

  const vip = getVipData(vipPoints);

  // RANK DEFINITIONS (1-100)
  const getRankData = (level: number) => {
    // Progression cost formula: Base 200, +15% per level, capped at reasonable growth
    const goldCost = Math.floor(200 * Math.pow(1.15, level - 1));
    
    let title = "Citizen";
    if (level >= 100) title = "Mighty Boss";
    else if (level >= 95) title = "Grand Emperor";
    else if (level >= 90) title = "Imperial Sovereign";
    else if (level >= 80) title = "Supreme Regent";
    else if (level >= 70) title = "High Commandant";
    else if (level >= 60) title = "Sector Governor";
    else if (level >= 50) title = "Distinguished Proconsul";
    else if (level >= 40) title = "Capital Magistrate";
    else if (level >= 30) title = "Regional Director";
    else if (level >= 25) title = "Senior Executive";
    else if (level >= 20) title = "Political Elite";
    else if (level >= 15) title = "Ascendant Specialist";
    else if (level >= 10) title = "Alpha Apprentice";
    else if (level >= 5) title = "Civic Resident";
    else if (level >= 2) title = "New Citizen";

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
      alert("Invalid TON address format. Should start with EQ or UQ.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ wallet_address: manualWallet })
      .eq('telegram_id', userData.telegram_id);
    
    if (!error) {
      alert("Imperial Registry Updated: Wallet linked manually.");
      setShowManual(false);
    } else {
      alert("Registry Sync Failed: " + error.message);
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
      const targetRegion = userData.region || 'middle_east';

      // 1. Atomic RPC Claim (The most reliable method)
      // Only updates currency and cooldown; the DB already knows the current resource balances.
      const { error: rpcError } = await supabase.rpc('claim_mining_with_tax', {
        p_telegram_id: userData.telegram_id,
        p_net_currency: Number(newResources.localCurrency),
        p_tax_amount: Number(taxDeduction),
        p_region_id: targetRegion
      });

      if (rpcError) {
        console.warn("RPC Claim failed or parameters mismatched:", rpcError);
        
        // Strict Fallback: Update only currency and cooldown, DO NOT overwrite resources
        const { error: userError } = await supabase
          .from('users')
          .update({
            local_currency_balance: newResources.localCurrency,
            last_claim: new Date().toISOString()
          })
          .eq('telegram_id', userData.telegram_id);

        if (userError) throw userError;

        // Update Regional Treasury
        const { data: regionData } = await supabase
          .from('regions')
          .select('tax_treasury')
          .eq('id', targetRegion)
          .single();
        
        const currentTax = Number(regionData?.tax_treasury || 0);
        
        await supabase
          .from('regions')
          .update({ tax_treasury: currentTax + taxDeduction })
          .eq('id', targetRegion);
      }

      onClaimSuccess(newResources);
    } catch (err) {
      console.error("Mining Sync Failure:", err);
      alert("Mining Interrupted: Registry sync refused. Please ensure the SQL script is run and the region is set correctly.");
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
      case 'middle_east': return { name: 'Middle East Dinar', code: 'BTM', color: 'text-accent-cyan' };
      case 'africa': return { name: 'African Credits', code: 'BTF', color: 'text-amber-500' };
      case 'europe': return { name: 'Euro-Sovereign', code: 'BTE', color: 'text-blue-500' };
      case 'asia': return { name: 'Asian Yuan-B', code: 'BTA', color: 'text-red-500' };
      case 'east_asia': return { name: 'East Asian Yen', code: 'BTR', color: 'text-purple-500' };
      default: return { name: 'Imperial Credits', code: 'BTX', color: 'text-zinc-500' };
    }
  };

  const regionalCurrency = getRegionalCurrency(userData?.region || '');

  return (
    <div className="space-y-6 pb-24">
      {/* VIP Status Bar */}
      {vip.level > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`mx-4 p-2 rounded-lg border flex items-center justify-between bg-black/40 ${vip.border.split(' ')[0]}`}
        >
          <div className="flex items-center gap-2">
             <Trophy className={`w-3 h-3 ${vip.level >= 10 ? 'text-yellow-400' : vip.level >= 8 ? 'text-red-500' : vip.level >= 5 ? 'text-blue-500' : 'text-emerald-500'}`} />
             <span className="text-[9px] font-black uppercase tracking-widest text-white">VIP LEVEL {vip.level}: {vip.name}</span>
          </div>
          <div className="flex gap-2">
            {vip.atk > 0 && <span className="text-[8px] font-mono text-red-400">ATK +{vip.atk}%</span>}
            {vip.def > 0 && <span className="text-[8px] font-mono text-blue-400">DEF +{vip.def}%</span>}
          </div>
        </motion.div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className={`w-24 h-24 rounded-full bg-zinc-900 border-[3px] flex items-center justify-center text-4xl font-black text-black transition-all duration-500 overflow-hidden ${vip.border}`}>
            {userData?.photo_url ? (
              <img src={userData.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-accent-cyan">{userData?.username?.slice(0, 2).toUpperCase() || '??'}</span>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 text-black text-[9px] font-black px-2 py-0.5 rounded border border-black uppercase rotate-3 ${vip.level >= 10 ? 'bg-yellow-400' : 'bg-accent-cyan'}`}>
            LVL {currentLevel}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/appearance">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase text-zinc-400 hover:text-white transition-colors flex items-center gap-1 mx-auto"
            >
              <Zap className="w-2.5 h-2.5 text-accent-cyan" /> Appearance
            </motion.button>
          </Link>
          <h2 className="text-2xl font-black tracking-tight">@{userData?.username || 'Citizen'}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-3 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-black uppercase text-accent-cyan tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              {getRankData(currentLevel).title}
            </span>
            {vip.level > 0 && (
              <span className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                {vipPoints.toLocaleString()} PTS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sovereign Wealth Section */}
      <div className="tech-card border-accent-orange/40 bg-accent-orange/5 p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sovereign Wealth</span>
            <span className={`text-2xl font-black ${regionalCurrency.color || 'text-white'}`}>{resources.localCurrency?.toLocaleString() || '0.00'} {regionalCurrency.code}</span>
          </div>
          <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-[9px] font-mono text-zinc-400">
            {regionalCurrency.name}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
          <Zap className="w-3 h-3 text-accent-orange" />
          Actively mining {regionalCurrency.code} for the {userData?.region?.replace('_', ' ').toUpperCase()} Empire
        </div>
      </div>

      {/* Rank Promotion Progress (Gold Only) */}
      {currentLevel < 100 && (
        <div className="tech-card border-orange-500/30 bg-orange-500/5 p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Rank Advancement</span>
              <span className="text-sm font-bold text-white uppercase italic">NEXT: {nextRank.title}</span>
            </div>
            <button 
              onClick={handleRankPromotion}
              disabled={promoting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-95 transition-all disabled:opacity-50"
            >
              {promoting ? 'PROCESSING...' : 'REQUEST PROMOTION'}
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
              <span>Required: GOLD</span>
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
                Rank Level permits owning up to <span className="text-white font-bold">{currentLevel} Unit(s)</span> in the Arsenal.
              </p>
            </div>
            {currentLevel < 20 && (
              <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tight">
                Level 20 unlocks Political Candidacy Eligibility.
              </p>
            )}
            {currentLevel >= 20 && (
              <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-tight flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" /> Political Candidacy Verified
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
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-none mb-1">Strategic Command</span>
              <span className="text-sm font-bold text-white uppercase">Go to Military Camp</span>
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
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] block mb-2">Extraction Core</span>
          <div className="text-sm font-bold text-white uppercase italic tracking-widest opacity-60">
            {userData?.region?.replace('_', ' ') || 'Syncing Region...'}
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
                <span className="text-[8px] uppercase tracking-tighter opacity-50">Cooldown</span>
              </>
            ) : (
              <>
                <Zap className="w-8 h-8 text-accent-cyan mb-2 group-hover:animate-bounce" />
                <span className="text-[12px] font-black uppercase tracking-tighter text-center">Execute<br/>Mining</span>
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
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Imperial Treasury Link</span>
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
                  Confirm Link
                </button>
                <button 
                  onClick={() => setShowManual(false)}
                  className="px-4 bg-zinc-800 text-zinc-400 text-[10px] font-bold py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowManual(true)}
              className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Link Manually (Fallback)
            </button>
          )}

          {(walletAddress || userData?.wallet_address) && (
            <div className="text-[10px] font-mono text-cyan-400 truncate bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/20 flex flex-col gap-1">
              <span className="text-zinc-500 text-[8px] uppercase">Linked Telegram Wallet</span>
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
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Production</span>
          </div>
          <div className="text-xl font-black text-white">{boostedMining.toFixed(2)}/hr</div>
          <p className="text-[8px] text-zinc-500 leading-tight">Base rate + { (boost * 100).toFixed(0) }% Referral Boost</p>
        </div>
        
        <div className="bento-card p-4 space-y-2 border-accent-orange/20">
          <div className="flex justify-between items-start">
            <Briefcase className="w-4 h-4 text-accent-orange" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Employment</span>
          </div>
          <div className="text-sm font-bold text-white uppercase italic">
            {(userData?.region || 'Imperial').replace('_', ' ')} Enterprise
          </div>
          <p className="text-[8px] text-zinc-500 leading-tight">Sector production contract active</p>
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Imperial Ranking</span>
          </motion.button>
        </Link>
      </div>

      {/* Property Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-zinc-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Real Estate Assets</h3>
          </div>
          <Link href="/real-estate">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
              Enter Map <ArrowRight className="w-3 h-3" />
            </motion.button>
          </Link>
        </div>
        
        {loadingEstate ? (
          <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 flex justify-center">
             <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
          </div>
        ) : !realEstate.house && !realEstate.car && !realEstate.shop ? (
          <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 text-center cursor-pointer hover:bg-white/5 transition-all group" onClick={() => window.location.href = '/real-estate'}>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter group-hover:text-white transition-colors">No registered properties in this sector. Tap Enter to explore.</p>
          </div>
        ) : (
          <div className="tech-card border-zinc-800/50 bg-black/20 p-4">
            <div className="flex items-center justify-around gap-2">
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.house ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Home className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">Estate</span>
               </div>
               <div className="w-[1px] h-8 bg-white/5" />
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.car ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Car className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">Transport</span>
               </div>
               <div className="w-[1px] h-8 bg-white/5" />
               <div className={`flex flex-col items-center gap-2 transition-opacity ${realEstate.shop ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white">Market</span>
               </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
