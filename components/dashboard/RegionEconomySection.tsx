'use client';

import { motion } from 'motion/react';
import { Globe, Users, Factory, Coins, ShieldAlert, Crown, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import { calculateResourcePrice, PRICE_LOT_SIZE } from '@/lib/marketUtils';

const REGION_META: Record<string, any> = {
  middle_east: { name: 'Middle East', primary: 'Oil', color: 'accent-cyan' },
  asia: { name: 'Asia', primary: 'Gold', color: 'accent-blue' },
  africa: { name: 'Africa', primary: 'Iron', color: 'accent-orange' },
  europe: { name: 'Europe', primary: 'Wheat', color: 'text-purple-400' },
};

export default function RegionEconomySection({ regionId }: { regionId: string }) {
  const [citizenCount, setCitizenCount] = useState(0);
  const [regionalTreasury, setRegionalTreasury] = useState({ oil: 0, gold: 0, iron: 0, wheat: 0, ton: 0 });
  const [overlord, setOverlord] = useState('The Overlord');
  const [totalRegionalYield, setTotalRegionalYield] = useState(0);
  const region = REGION_META[regionId] || { name: 'Unknown Sector', primary: 'General', color: 'zinc-500' };

  useEffect(() => {
    const fetchRegionStats = async () => {
      // 1. Fetch Citizen Count
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('region', regionId);
      
      setCitizenCount(count || 0);

      // 2. Fetch Real Global Reserves (Treasury)
      const { data: treasuryData } = await supabase
        .from('regions')
        .select('oil_treasury, gold_treasury, iron_treasury, wheat_treasury, tax_treasury')
        .eq('id', regionId)
        .single();
      
      if (treasuryData) {
        setRegionalTreasury({
          oil: treasuryData.oil_treasury || 0,
          gold: treasuryData.gold_treasury || 0,
          iron: treasuryData.iron_treasury || 0,
          wheat: treasuryData.wheat_treasury || 0,
          ton: treasuryData.tax_treasury || 0
        });
      }

      // 3. Fetch The Overlord (Top Rank Person in the Region)
      const { data: topUsers } = await supabase
        .from('users')
        .select('username')
        .eq('region', regionId)
        .order('rank', { ascending: false })
        .limit(1);
      
      if (topUsers?.[0]) {
        setOverlord(`@${topUsers[0].username}` || 'The Overlord');
      }

      // 4. Fetch Total Regional Yield (Sum of all company production in sector)
      const { data: companies } = await supabase
        .from('companies')
        .select('level, resource_type, region')
        .eq('region', regionId)
        .eq('resource_type', region.primary.toLowerCase());
      
      if (companies) {
        const total = companies.reduce((acc, company) => {
          // Simplified production formula matching CompaniesSection logic
          let base = 50; 
          if (company.resource_type === 'wheat') base = 40;
          if (company.resource_type === 'oil') base = 60;
          const levelMultiplier = 1 + (company.level * 0.2);
          
          let regionalBonus = 1;
          if (company.region === 'middle_east' && company.resource_type === 'oil') regionalBonus = 1.5;
          if (company.region === 'africa' && company.resource_type === 'gold') regionalBonus = 1.6;
          if (company.region === 'europe' && company.resource_type === 'iron') regionalBonus = 1.3;
          if (company.region === 'asia' && company.resource_type === 'wheat') regionalBonus = 1.5;
          if (company.region === 'east_asia') regionalBonus = 1.15;

          return acc + Math.floor(base * levelMultiplier * regionalBonus);
        }, 0);
        
        // Multiply by citizen activity factor (arbitrary but realistic for macro view)
        setTotalRegionalYield(total * (count || 1) * 0.5); 
      }
    };
    fetchRegionStats();
  }, [regionId, region.primary]);

  // Dynamic calculations for price using real market utility
  const getResourceReserve = () => {
    const p = region.primary.toLowerCase();
    if (p === 'oil') return regionalTreasury.oil;
    if (p === 'gold') return regionalTreasury.gold;
    if (p === 'iron') return regionalTreasury.iron;
    if (p === 'wheat') return regionalTreasury.wheat;
    return 0;
  };

  const pricePerUnit = calculateResourcePrice(region.primary, getResourceReserve());
  const currentPrice = (pricePerUnit * PRICE_LOT_SIZE).toFixed(2);
  const supplyRatio = Math.min(1, getResourceReserve() / 500000); // Visual indicator 

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
          <div className="text-2xl font-black">{(totalRegionalYield / 1000).toFixed(1)}k</div>
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
            <div className="text-[9px] font-mono text-emerald-500 flex items-center justify-end gap-1">
              <ArrowUp className="w-3 h-3" />
              {(supplyRatio * 10).toFixed(1)}%
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
              animate={{ width: `${(supplyRatio * 100).toFixed(0)}%` }} 
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
          <div className="text-sm font-bold uppercase text-white truncate">{overlord}</div>
          <p className="text-[8px] text-zinc-500">Term: Permanent</p>
        </div>
      </div>

      {/* Real Strategic Reserves (The Imperial Treasury) */}
      <div className="tech-card bg-zinc-900 border-accent-cyan/20 p-5 space-y-4">
        <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Imperial Strategic Reserves</span>
          </div>
          <span className="text-accent-orange font-mono text-[10px]">{regionalTreasury.ton.toFixed(2)} TON</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center group">
            <div className="text-[8px] text-zinc-600 mb-1">RESERVE OIL</div>
            <div className="text-xs font-black text-white">{regionalTreasury.oil.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-[8px] text-zinc-600 mb-1">RESERVE GLD</div>
            <div className="text-xs font-black text-white">{regionalTreasury.gold.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-[8px] text-zinc-600 mb-1">RESERVE IRN</div>
            <div className="text-xs font-black text-white">{regionalTreasury.iron.toLocaleString()}</div>
          </div>
          <div className="text-center group">
            <div className="text-[8px] text-zinc-600 mb-1">RESERVE WHT</div>
            <div className="text-xs font-black text-white">{regionalTreasury.wheat.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3 italic">
        <span className="text-blue-400 text-xs text-center font-bold">!</span>
        <p className="text-[10px] text-blue-400 leading-tight">
          Sovereign production is automatically deposited into the Reserves every hour based on citizen deployment. Regional assets fund imperial defense.
        </p>
      </div>
    </div>
  );
}
