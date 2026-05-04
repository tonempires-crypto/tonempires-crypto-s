'use client';

import { motion } from 'motion/react';
import { Wallet, Briefcase, Shield, Home, Sword, Zap, Hourglass } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfileSection({ userData, resources, miningRates }: { userData: any, resources: any, miningRates: any }) {
  const walletAddress = useTonAddress();
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!userData?.telegram_id) return;
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', userData.telegram_id);
      
      if (!error) setReferralCount(count || 0);
    };
    fetchReferrals();
  }, [userData]);

  const boost = referralCount * 0.05;
  const totalMining = Object.values(miningRates).reduce((a: any, b: any) => a + b, 0) as number;
  const boostedMining = totalMining * (1 + boost);

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue border-2 border-accent-cyan/30 flex items-center justify-center text-4xl font-black text-black shadow-[0_0_30px_rgba(0,255,209,0.2)]">
          {userData?.username?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">@{userData?.username || 'Citizen'}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-mono text-accent-cyan uppercase tracking-widest">Citizen Status: Active</span>
          </div>
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
