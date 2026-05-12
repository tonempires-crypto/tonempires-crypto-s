'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  Landmark, 
  MapPin, 
  Coins, 
  AlertCircle,
  GanttChartSquare,
  Swords,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';

interface GovernmentSectionProps {
  userData: any;
  resources: any;
}

export default function GovernmentSection({ userData, resources }: GovernmentSectionProps) {
  const { t } = useTranslation();
  const region = userData?.region || 'middle_east';
  const [stats, setStats] = useState({ population: 0, totalCirculation: 0, totalTonDeposited: 0, taxTreasury: 0 });
  const [reserves, setReserves] = useState({ oil: 0, gold: 0, iron: 0, wheat: 0 });
  const [loading, setLoading] = useState(true);
  
  const regionData = useMemo(() => {
    switch (region) {
      case 'middle_east': return { name: t('regions.middle_east'), resource: 'OIL', currency: 'BTM', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' };
      case 'africa': return { name: t('regions.africa'), resource: 'WHEAT', currency: 'BTF', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'europe': return { name: t('regions.europe'), resource: 'IRON', currency: 'BTE', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'asia': return { name: t('regions.asia'), resource: 'GOLD', currency: 'BTA', color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'east_asia': return { name: t('regions.east_asia'), resource: 'HIGH-TECH', currency: 'BTR', color: 'text-purple-500', bg: 'bg-purple-500/10' };
      default: return { name: t('regions.neutral'), resource: 'NONE', currency: 'BTX', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    }
  }, [region, t]);

  const fetchStats = async () => {
    try {
      // Fetch real-time aggregated stats
      const { data: statsData } = await supabase
        .from('regional_stats')
        .select('*')
        .eq('region', region)
        .single();

      // Fetch regional treasury reserves
      const { data: regionData } = await supabase
        .from('regions')
        .select('*')
        .eq('id', region)
        .single();

      if (statsData) {
        setStats({
          population: statsData.population || 0,
          totalCirculation: statsData.total_circulation || 0,
          totalTonDeposited: regionData?.total_ton_deposited || 0,
          taxTreasury: regionData?.tax_treasury || 0
        });
      }

      if (regionData) {
        setReserves({
          oil: Math.floor(regionData.oil_treasury || 0),
          gold: Math.floor(regionData.gold_treasury || 0),
          iron: Math.floor(regionData.iron_treasury || 0),
          wheat: Math.floor(regionData.wheat_treasury || 0)
        });
      }
    } catch (e) {
      console.error("Failed to fetch regional stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (region) fetchStats();
  }, [region]);
  
  // Price Formula: (Total amount mined by citizens) ÷ (Total TONs deposited) 
  // Minimum 1, then multiplied by population * 0.01
  const rawPrice = stats.totalTonDeposited > 0 ? stats.totalCirculation / stats.totalTonDeposited : 1;
  const basePrice = Math.max(1, rawPrice);
  const finalPrice = basePrice * stats.population * 0.01;

  const roles = [
    { title: t('gov.president'), icon: Users, status: t('gov.soon') },
    { title: t('gov.parliament'), icon: Landmark, status: t('gov.soon') },
    { title: t('gov.commander'), icon: Swords, status: t('gov.soon') }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-4">
        <RefreshCw className="w-8 h-8 text-accent-cyan animate-spin" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('gov.sync')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 h-full overflow-y-auto px-1">
      {/* Region Status Header */}
      <div className={`p-6 rounded-2xl border border-white/10 ${regionData.bg} relative overflow-hidden`}>
        <div className="flex items-center gap-3 mb-2">
          <MapPin className={`w-5 h-5 ${regionData.color}`} />
          <h2 className="text-xl font-black tracking-tight">{regionData.name} {t('gov.treasury')}</h2>
        </div>
        <p className="text-xs text-zinc-400 font-mono italic">{t('gov.operational')}</p>
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
                <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">{t('gov.authority')}</span>
              </div>
            </div>
            <div className="bg-black/60 px-3 py-1 rounded-full border border-white/5">
              <span className="text-[10px] font-mono text-accent-orange animate-pulse">{role.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Military Command Section (COMING SOON but backend ready) */}
      <div className="tech-card p-5 border-red-900/20 bg-red-950/10 border-dashed">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-red-500">{t('gov.command')}</h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-600 uppercase">{t('gov.reserves_req')}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <span className="text-2xl font-black text-white/20 tracking-tighter uppercase italic">{t('gov.defend')}</span>
          <span className="text-[10px] text-red-800 font-bold uppercase animate-pulse">{t('gov.soon')}</span>
        </div>
      </div>

      {/* Regional Macro Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="tech-card p-5 border-accent-cyan/20 bg-accent-cyan/5">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-cyan">{t('gov.tax_treasury')}</h3>
          </div>
          <div className="text-xl font-black text-white">{stats.taxTreasury.toLocaleString()} {regionData.currency}</div>
          <div className="text-[9px] text-zinc-600 mt-1 uppercase">{t('gov.dues')}</div>
        </div>

        <div className="tech-card p-5 border-accent-orange/20 bg-accent-orange/5">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-accent-orange" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('gov.circulation')}</span>
          </div>
          <div className="text-xl font-black text-white">{stats.totalCirculation.toLocaleString()} {regionData.currency}</div>
          <div className="text-[9px] text-zinc-600 mt-1 uppercase">{t('gov.supply')}</div>
        </div>
      </div>

      <div className="tech-card p-5 border-accent-cyan/20 bg-accent-cyan/5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-accent-cyan" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('gov.market_value')}</span>
        </div>
        <div className="text-xl font-black text-accent-cyan">${finalPrice.toFixed(4)}</div>
        <div className="text-[9px] text-zinc-600 mt-1 uppercase">{t('gov.ton_indexed')}</div>
      </div>

      {/* State Strategic Reserves */}
      <div className="tech-card p-6 border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <GanttChartSquare className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">{t('gov.resource_reserves')}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          {Object.entries(reserves).map(([key, val]) => (
            <div key={key} className="flex flex-col border-l border-white/5 pl-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{t(`dash.resources.${key}`)}</span>
              <span className="text-lg font-bold text-white leading-none">{val.toLocaleString()}</span>
              <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-600" 
                  style={{ width: `${Math.min(100, (val / 5000) * 100)}%` }}
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
          {t('gov.price_notice')} ({stats.population}). {t('gov.node_cycle')}
        </p>
      </div>
    </div>
  );
}
