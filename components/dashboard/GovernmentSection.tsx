'use client';

import React, { useMemo } from 'react';
import { 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  Landmark, 
  MapPin, 
  Coins, 
  AlertCircle,
  GanttChartSquare,
  Swords
} from 'lucide-react';

interface GovernmentSectionProps {
  userData: any;
  resources: any;
}

export default function GovernmentSection({ userData, resources }: GovernmentSectionProps) {
  const region = userData?.region || 'middle_east';
  
  const regionData = useMemo(() => {
    switch (region) {
      case 'middle_east': return { name: 'Middle East', resource: 'OIL', currency: 'BTM', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' };
      case 'africa': return { name: 'Africa', resource: 'WHEAT', currency: 'BTF', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'europe': return { name: 'Europe', resource: 'IRON', currency: 'BTE', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'asia': return { name: 'Asia', resource: 'GOLD', currency: 'BTA', color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'east_asia': return { name: 'East Asia', resource: 'HIGH-TECH', currency: 'BTR', color: 'text-purple-500', bg: 'bg-purple-500/10' };
      default: return { name: 'Imperial Neutral Zone', resource: 'NONE', currency: 'BTX', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    }
  }, [region]);

  // Mocked global stats for logic demonstration 
  // (In production these would be fetched from aggregated SQL views)
  const population = 1250; // Mock total regional users
  const totalCirculation = 450000; // Total BT(X) mined by all citizens
  const totalTonDeposited = 150; // Total TON locked in treasury
  
  // Price Formula: (Total amount mined by citizens) ÷ (Total TONs deposited) 
  // Minimum 1, then multiplied by population * 0.01
  const rawPrice = totalTonDeposited > 0 ? totalCirculation / totalTonDeposited : 1;
  const basePrice = Math.max(1, rawPrice);
  const finalPrice = basePrice * population * 0.01;

  const roles = [
    { title: 'President', icon: Users, status: 'Coming Soon' },
    { title: 'Parliament', icon: Landmark, status: 'Coming Soon' },
    { title: 'Army Commander', icon: Swords, status: 'Coming Soon' }
  ];

  const regionTreasury = {
    oil: 4520,
    gold: 1240,
    iron: 8900,
    wheat: 15600
  };

  return (
    <div className="space-y-6 pb-24 h-full overflow-y-auto px-1">
      {/* Region Status Header */}
      <div className={`p-6 rounded-2xl border border-white/10 ${regionData.bg} relative overflow-hidden`}>
        <div className="flex items-center gap-3 mb-2">
          <MapPin className={`w-5 h-5 ${regionData.color}`} />
          <h2 className="text-xl font-black tracking-tight">{regionData.name} State Treasury</h2>
        </div>
        <p className="text-xs text-zinc-400 font-mono italic">Sector Security: High Alert Phase 2</p>
      </div>

      {/* Leadership Section */}
      <div className="grid grid-cols-1 gap-3">
        {roles.map((role, idx) => (
          <div key={idx} className="tech-card p-4 border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 group-hover:border-accent-orange/30 transition-colors">
                <role.icon className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-300">{role.title}</span>
                <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">Sovereign Authority</span>
              </div>
            </div>
            <div className="bg-black/60 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[10px] font-mono text-accent-orange animate-pulse">{role.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regional Macro Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="tech-card p-5 border-accent-orange/20 bg-accent-orange/5">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-accent-orange" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">In Circulation</span>
          </div>
          <div className="text-xl font-black text-white">{totalCirculation.toLocaleString()} {regionData.currency}</div>
          <div className="text-[9px] text-zinc-600 mt-1 uppercase">Global Supply Block</div>
        </div>

        <div className="tech-card p-5 border-accent-cyan/20 bg-accent-cyan/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent-cyan" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Market Value</span>
          </div>
          <div className="text-xl font-black text-accent-cyan">${finalPrice.toFixed(4)}</div>
          <div className="text-[9px] text-zinc-600 mt-1 uppercase">TON Indexed Yield</div>
        </div>
      </div>

      {/* State Strategic Reserves */}
      <div className="tech-card p-6 border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <GanttChartSquare className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Regional Resource Reserves</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          {Object.entries(regionTreasury).map(([key, val]) => (
            <div key={key} className="flex flex-col border-l border-white/5 pl-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{key}</span>
              <span className="text-lg font-bold text-white leading-none">{val.toLocaleString()}</span>
              <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-600" 
                  style={{ width: `${Math.min(100, (val / 20000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Notice */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
          Currency price is calculated using physical TON backing against circulating supply, weighted by current citizenship population ({population}). All figures are updated per node cycle.
        </p>
      </div>
    </div>
  );
}
