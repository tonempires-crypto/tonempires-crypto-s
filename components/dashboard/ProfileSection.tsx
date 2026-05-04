'use client';

import { motion } from 'motion/react';
import { Wallet, Briefcase, Shield, Home, Sword, Zap, Hourglass } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfileSection({ userData, resources, miningRates, onClaimSuccess }: { userData: any, resources: any, miningRates: any, onClaimSuccess: (newResources: any) => void }) {
  const walletAddress = useTonAddress();
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Sync wallet address to DB
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
    const gain = 3600 * boost; // 1 hour worth of mining in one go

    const newResources = {
      oil: (resources.oil || 0) + (miningRates.oil * gain),
      gold: (resources.gold || 0) + (miningRates.gold * gain),
      iron: (resources.iron || 0) + (miningRates.iron * gain),
      wheat: (resources.wheat || 0) + (miningRates.wheat * gain),
      ton: resources.ton
    };

    const { error } = await supabase
      .from('users')
      .update({
        oil: newResources.oil,
        gold: newResources.gold,
        iron: newResources.iron,
        wheat: newResources.wheat,
        last_claim: new Date().toISOString()
      })
      .eq('telegram_id', userData.telegram_id);

    if (!error) {
      onClaimSuccess(newResources);
    }
    setLoading(false);
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const boost = referralCount * 0.05;
  const totalMining = Object.values(miningRates).reduce((a: any, b: any) => a + b, 0) as number;
  const boostedMining = totalMining * (1 + boost);

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
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-mono text-accent-cyan uppercase tracking-widest">Citizen Rank: Alpha</span>
          </div>
        </div>
      </div>

      {/* Hourly Mining Button */}
      <div className="tech-card border-accent-cyan/40 bg-accent-cyan/5 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Zap className="w-16 h-16 text-accent-cyan" />
        </div>
        <div className="text-center space-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mb-2">Regional Resource Mining</span>
            <div className="text-2xl font-black text-white uppercase italic">
              {userData?.region?.replace('_', ' ') || 'Establishing Link...'}
            </div>
          </div>
          
          <button 
            onClick={handleMine}
            disabled={loading || timeLeft > 0}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,209,0.2)]
              ${timeLeft > 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-accent-cyan text-black hover:brightness-110'}`}
          >
            {loading ? 'SYNCING...' : timeLeft > 0 ? `COOLDOWN: ${formatTime(timeLeft)}` : 'MINE HOURLY YIELD'}
          </button>
          
          <p className="text-[9px] font-mono text-zinc-500">
            Yield calculated at 0.01 base + regional modifiers + { (referralCount * 5) }% referral boost
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
          {walletAddress && (
            <div className="text-[10px] font-mono text-zinc-500 truncate bg-black/40 p-2 rounded-lg border border-white/5">
              Connected: {walletAddress}
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
          <div className="text-sm font-bold text-white uppercase italic">Independent</div>
          <p className="text-[8px] text-zinc-500 leading-tight">Product Co. Contracts: Coming Soon</p>
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
