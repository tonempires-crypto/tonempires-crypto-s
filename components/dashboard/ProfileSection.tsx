'use client';

import { motion } from 'motion/react';
import { Wallet, Briefcase, Shield, Home, Sword, Zap, Hourglass, ShieldAlert, Loader2 } from 'lucide-react';
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

  // Job system logic
  const jobRanks = [
    { title: 'Alpha Apprentice', level: 1, req: 0 },
    { title: 'Sector Specialist', level: 2, req: 200 },
    { title: 'Regional Supervisor', level: 3, req: 800 },
    { title: 'Imperial Director', level: 4, req: 2500 }
  ];

  const currentRankIndex = userData?.job_level ? userData.job_level - 1 : 0;
  const nextRank = jobRanks[currentRankIndex + 1];

  const handlePromote = async () => {
    if (!nextRank || promoting) return;
    
    const req = nextRank.req;
    if (resources.oil < req || resources.gold < req || resources.iron < req || resources.wheat < req) {
      alert(`Promotion requires ${req} of ALL resources.`);
      return;
    }

    setPromoting(true);
    try {
      // 1. Deduct resources from user_resources table
      const { error: resError } = await supabase
        .from('user_resources')
        .update({
          oil: resources.oil - req,
          gold: resources.gold - req,
          iron: resources.iron - req,
          wheat: resources.wheat - req
        })
        .eq('telegram_id', userData.telegram_id);

      if (resError) throw resError;

      // 2. Update rank in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ job_level: nextRank.level })
        .eq('telegram_id', userData.telegram_id);

      if (userError) throw userError;
      
      alert(`PROMOTED TO ${nextRank.title.toUpperCase()}! Your influence grows.`);
      window.location.reload(); // Refresh to update all stats
    } catch (e) {
      console.error(e);
      alert("Promotion failed. Registry link unstable.");
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
    const totalYield = 10 * boost; 
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
  const boostedMining = baseRate * (1 + boost);

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
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue border-2 border-accent-cyan/30 flex items-center justify-center text-4xl font-black text-black shadow-[0_0_30px_rgba(0,255,209,0.2)]">
          {userData?.username?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">@{userData?.username || 'Citizen'}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-mono text-accent-cyan uppercase tracking-widest">
              {jobRanks[currentRankIndex]?.title || 'Alpha Apprentice'}
            </span>
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

      {/* Promotion Logic UI */}
      {nextRank && (
        <div className="tech-card border-white/10 bg-zinc-900/50 p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Next Rank</span>
              <span className="text-sm font-bold text-white uppercase">{nextRank.title}</span>
            </div>
            <button 
              onClick={handlePromote}
              disabled={promoting}
              className="px-4 py-2 bg-accent-orange text-black rounded-lg text-[10px] font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {promoting ? 'PROCESSING...' : 'REQUEST PROMOTION'}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
              <span>Required Resources</span>
              <span>{nextRank.req} of each</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {['oil', 'gold', 'iron', 'wheat'].map(res => (
                <div key={res} className={`h-1 rounded-full ${resources[res] >= nextRank.req ? 'bg-accent-cyan' : 'bg-zinc-800'}`} />
              ))}
            </div>
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

      {/* Property Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-zinc-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Real Estate Assets</h3>
        </div>
        <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 text-center">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">No registered properties in this sector</p>
        </div>
      </section>

      {/* Military Inventory */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sword className="w-4 h-4 text-zinc-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weapons & Equipment</h3>
        </div>
        <div className="tech-card border-dashed border-zinc-800 bg-transparent py-8 text-center">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">Armory Empty. Visit Trade Hub for equipment.</p>
        </div>
      </section>
    </div>
  );
}
