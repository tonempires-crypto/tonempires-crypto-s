'use client';

import { motion } from 'motion/react';
import { Globe, Users, Factory, Coins, ShieldAlert, Crown, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const REGION_META: Record<string, any> = {
  middle_east: { name: 'Middle East', primary: 'Oil', color: 'accent-cyan' },
  asia: { name: 'Asia', primary: 'Gold', color: 'accent-blue' },
  africa: { name: 'Africa', primary: 'Iron', color: 'accent-orange' },
  europe: { name: 'Europe', primary: 'Wheat', color: 'text-purple-400' },
};

export default function RegionEconomySection({ regionId }: { regionId: string }) {
  const [citizenCount, setCitizenCount] = useState(0);
  const region = REGION_META[regionId] || { name: 'Unknown Sector', primary: 'General', color: 'zinc-500' };

  useEffect(() => {
    const fetchRegionStats = async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('region', regionId);
      
      if (!error) setCitizenCount(count || 0);
    };
    fetchRegionStats();
  }, [regionId]);

  // Dynamic calculations based on citizen count
  const baseProduction = citizenCount * 1.5;
  const supplyFactor = Math.max(0.1, 1 - (citizenCount / 1000)); // Price decreases as citizens (supply) increase
  const currentPrice = (2.5 * supplyFactor).toFixed(2);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Globe className="w-6 h-6 text-accent-cyan" />
          {region.name} Economy
        </h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Macro-Economic Sector Analysis</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="tech-card bg-zinc-900/40 p-4 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-zinc-500">
            <Users className="w-4 h-4" />
            <span className="text-[9px] font-mono">POPULATION</span>
          </div>
          <div className="text-2xl font-black">{citizenCount.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-emerald-500">ACTIVE CITIZENS</div>
        </div>

        <div className="tech-card bg-zinc-900/40 p-4 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-zinc-500">
            <Factory className="w-4 h-4" />
            <span className="text-[9px] font-mono">YIELD</span>
          </div>
          <div className="text-2xl font-black">{baseProduction.toFixed(1)}k</div>
          <div className="text-[9px] font-mono text-accent-cyan">TOTAL HOURLY {region.primary.toUpperCase()}</div>
        </div>
      </div>

      {/* Price Dynamics Card */}
      <div className="tech-card bg-gradient-to-r from-accent-orange/10 to-transparent border-accent-orange/20 overflow-hidden relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent-orange" />
            <div>
              <h3 className="text-sm font-black uppercase">{region.primary} Market Price</h3>
              <p className="text-[9px] font-mono text-zinc-500">Fluctuating based on Global Supply</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-white">{currentPrice} TON</div>
            <div className="text-[9px] font-mono text-red-500 flex items-center justify-end gap-1">
              <ArrowDown className="w-3 h-3" />
              -{( (1 - supplyFactor) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Simple Progress Bar as "Supply Meter" */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
            <span>Critical Scarcity</span>
            <span>Oversupply</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(citizenCount / 10).toFixed(0)}%` }} 
              className="h-full bg-accent-orange shadow-[0_0_10px_rgba(255,145,0,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Military & Leadership Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 space-y-2 opacity-50 border-white/5">
          <div className="flex justify-between items-center text-zinc-500">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[9px] font-mono uppercase tracking-tighter">MILITARY POWER</span>
          </div>
          <div className="text-sm font-bold uppercase italic text-zinc-500">Season 2</div>
          <p className="text-[8px] text-zinc-600">Strategic deployment pending</p>
        </div>

        <div className="bento-card p-4 space-y-2 border-white/5">
          <div className="flex justify-between items-center text-zinc-500">
            <Crown className="w-4 h-4 text-accent-cyan" />
            <span className="text-[9px] font-mono uppercase tracking-tighter">GOVERNANCE</span>
          </div>
          <div className="text-sm font-bold uppercase text-white truncate">The Overlord</div>
          <p className="text-[8px] text-zinc-500">Term: Permanent</p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3 italic">
        <span className="text-blue-400 text-xs text-center font-bold">!</span>
        <p className="text-[10px] text-blue-400 leading-tight">
          Sector production remains at Zero if no Citizens are deployed. Recruit new citizens to boost your region's economic standing.
        </p>
      </div>
    </div>
  );
}
