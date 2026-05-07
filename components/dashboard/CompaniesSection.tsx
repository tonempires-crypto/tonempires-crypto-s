'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Factory, Users, TrendingUp, Hammer, Shield, Coins, Plus, ChevronRight, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface CompaniesSectionProps {
  userData: any;
  resources: any;
}

export default function CompaniesSection({ userData, resources }: CompaniesSectionProps) {
  const [govCompanies, setGovCompanies] = useState<any[]>([]);
  const [privateCompanies, setPrivateCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const regionId = userData?.region || 'middle_east';

  useEffect(() => {
    if (regionId) fetchCompanies();
  }, [regionId]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      console.log("FETCHING COMPANIES FOR REGION:", regionId);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('region', regionId);

      if (error) {
        console.error("SUPABASE ERROR:", error);
        throw error;
      }

      const gov = data?.filter(c => c.is_government) || [];
      const priv = data?.filter(c => !c.is_government) || [];

      // RADICAL FIX: Strict 4-Sector Enforcement
      const resourceTypes = ['oil', 'gold', 'iron', 'wheat'];
      const finalGovs = [];
      const toDelete = [];

      for (const type of resourceTypes) {
        const typeGovs = gov.filter(c => c.resource_type === type);
        if (typeGovs.length === 0) {
          // Missing: Mark for creation
          console.warn(`MISSING SECTOR: ${type}`);
        } else {
          // Keep the first one, mark others for removal (Duplicates)
          finalGovs.push(typeGovs[0]);
          if (typeGovs.length > 1) {
            toDelete.push(...typeGovs.slice(1).map(c => c.id));
          }
        }
      }

      const missingTypes = resourceTypes.filter(type => !gov.find(c => c.resource_type === type));

      if (missingTypes.length > 0) {
        const names: Record<string, string[]> = {
          'middle_east': ['ME National Petroleum', 'ME Imperial Gold', 'ME Steel Works', 'ME Ceres Grain'],
          'africa': ['Pan-African Diamond Syndicate', 'Central Gold Reserve', 'Delta Oil Consortium', 'Savannah Grain Trust'],
          'europe': ['Euro-Iron Foundries', 'Alps Mineral Core', 'North Sea Energy', 'Rhine Agricultural Hub'],
          'asia': ['Eastern Dragon Minerals', 'Silk Road Textiles', 'Pacific Energy Grid', 'Yangtze Wheat Fields'],
          'east_asia': ['Neo-Tokyo Tech Core', 'Seoul Logic Foundry', 'Shanghai Quant-Energy', 'Global Feed Distribution']
        };
        const regionNames = names[regionId] || names['middle_east'];
        
        const newGovs = missingTypes.map(type => {
            const idx = resourceTypes.indexOf(type);
            return {
              name: regionNames[idx] || `Imperial ${type.toUpperCase()}`,
              is_government: true,
              resource_type: type,
              region: regionId,
              level: 1,
              employees_count: 0
            };
        });

        const { data: inserted } = await supabase.from('companies').insert(newGovs).select();
        if (inserted) finalGovs.push(...inserted);
      }

      if (toDelete.length > 0) {
        console.warn("PRUNING DUPLICATE SECTORS:", toDelete);
        await supabase.from('companies').delete().in('id', toDelete);
      }

      // Live Worker Sync (Fallbacks to direct count if RPC missing)
      const { data: workerCounts, error: workerError } = await supabase.rpc('get_company_worker_counts');
      
      let counts = workerCounts || [];
      if (workerError || !workerCounts) {
        console.warn("RPC Worker Count Failed, attempting aggregate query...");
        const { data: aggregate } = await supabase
          .from('users')
          .select('working_at_id')
          .not('working_at_id', 'is', null);
        
        const map: Record<string, number> = {};
        aggregate?.forEach((u: any) => {
          map[u.working_at_id] = (map[u.working_at_id] || 0) + 1;
        });
        counts = Object.entries(map).map(([id, count]) => ({ company_id: id, count }));
      }

      const syncedGov = finalGovs.map(c => ({
        ...c,
        employees_count: counts?.find((w: any) => w.company_id === c.id)?.count || 0
      }));

      // HARD SYNC: Only if changed
      for (const c of syncedGov) {
        const existing = gov.find(g => g.id === c.id);
        if (existing && existing.employees_count !== c.employees_count) {
          await supabase
            .from('companies')
            .update({ employees_count: c.employees_count })
            .eq('id', c.id);
        }
      }

      setGovCompanies(syncedGov);
      
      // REAL-TIME TREASURY PASSIVE PULSE
      const { processProductionPulse } = await import('@/lib/productionEngine');
      await processProductionPulse(regionId);
      
      const syncedPriv = priv.map(c => ({
        ...c,
        employees_count: counts?.find((w: any) => w.company_id === c.id)?.count || 0
      }));

      for (const c of syncedPriv) {
        const existing = priv.find(p => p.id === c.id);
        if (existing && existing.employees_count !== c.employees_count) {
          await supabase
            .from('companies')
            .update({ employees_count: c.employees_count })
            .eq('id', c.id);
        }
      }

      setPrivateCompanies(syncedPriv);
    } catch (e) {
      console.error("FATAL COMPANY FETCH ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWork = async (companyId: string) => {
    if (userData.working_at_id === companyId) {
      alert("Neural sync active: You are already stationed here.");
      return;
    }
    
    if (userData.working_at_id) {
      alert("Registry Lock: You cannot transfer sectors without high-level clearance.");
      return;
    }

    setActionLoading(companyId);
    try {
      // 1. Update User Record
      const { error: userError } = await supabase
        .from('users')
        .update({ working_at_id: companyId })
        .eq('telegram_id', userData.telegram_id);

      if (userError) throw userError;
      
      // 2. Atomic increment employees_count (Radical Verification)
      const { data: rpcRes, error: rpcError } = await supabase.rpc('increment_company_employees', { p_company_id: companyId });
      
      if (rpcError) {
        console.warn("RPC Failed, attempting direct increment legacy fallback...");
        const target = [...govCompanies, ...privateCompanies].find(c => c.id === companyId);
        await supabase.from('companies').update({ employees_count: (target?.employees_count || 0) + 1 }).eq('id', companyId);
      }

      alert("CONTRACT SIGNED: Your neural link is now registered to this production sector.");
      fetchCompanies(); // Refresh data instead of full reload for smoother UX
      window.location.reload(); 
    } catch (e) {
      console.error(e);
      alert("Sync Refused: Ensure your neural link is stable.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (company: any) => {
    // SECURITY CHECK: Only Admins or Presidents can authorize state upgrades
    const isAdmin = userData.is_admin;
    const isPresident = userData.is_president;

    if (company.is_government && !isAdmin && !isPresident) {
      alert("RESTRICTED: Only the High Council or Regional President can authorize state upgrades.");
      return;
    }

    if (!company.is_government && company.owner_id !== userData.telegram_id) {
       alert("SECURITY ALERT: Asset ownership mismatch.");
       return;
    }

    if (company.level >= 100) {
      alert("MAXIMUM EFFICIENCY REACHED.");
      return;
    }

    const upgradeCost = Math.floor(500 * Math.pow(1.5, company.level));
    const currencyCost = Math.floor(1000 * Math.pow(1.4, company.level));

    if (resources.oil < upgradeCost || resources.localCurrency < currencyCost) {
      alert(`Upgrading requires ${upgradeCost} resources and ${currencyCost} credits.`);
      return;
    }

    setActionLoading(`upgrade-${company.id}`);
    try {
      // 1. Deduct currency from users and resources from user_resources
      const { error: currencyErr } = await supabase
        .from('users')
        .update({
          local_currency_balance: resources.localCurrency - currencyCost
        })
        .eq('telegram_id', userData.telegram_id);
      
      if (currencyErr) throw currencyErr;

      const { error: resErr } = await supabase
        .from('user_resources')
        .update({
          oil: resources.oil - (company.resource_type === 'oil' ? upgradeCost : 0),
          gold: resources.gold - (company.resource_type === 'gold' ? upgradeCost : 0),
          iron: resources.iron - (company.resource_type === 'iron' ? upgradeCost : 0),
          wheat: resources.wheat - (company.resource_type === 'wheat' ? upgradeCost : 0)
        })
        .eq('telegram_id', userData.telegram_id);
      
      if (resErr) throw resErr;

      // 2. Increment level
      const { error } = await supabase
        .from('companies')
        .update({ level: company.level + 1 })
        .eq('id', company.id);

      if (error) throw error;
      
      alert(`SECTOR UPGRADED TO LEVEL ${company.level + 1}`);
      fetchCompanies();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const createPrivateCompany = async () => {
    if (resources.ton < 5) {
      alert("TREASURY ALERT: 5 TON is required to establish a private conglomerate.");
      return;
    }

    const resType = prompt("Choose Resource (oil, gold, iron, wheat):")?.toLowerCase();
    if (!['oil', 'gold', 'iron', 'wheat'].includes(resType || '')) {
      alert("Invalid Sector.");
      return;
    }

    setActionLoading('create');
    try {
      // 1. Charge TON
      await supabase
        .from('users')
        .update({ ton_balance: resources.ton - 5 })
        .eq('telegram_id', userData.telegram_id);

      // 2. Create Company
      const { error } = await supabase
        .from('companies')
        .insert({
          name: `${userData.username}'s Ltd`,
          is_government: false,
          resource_type: resType,
          region: regionId,
          owner_id: userData.telegram_id,
          level: 1
        });

      if (error) throw error;
      alert("INDUSTRIES INCORPORATED: Your private sector presence is established.");
      fetchCompanies();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const getProduction = (company: any) => {
    const base = 50; 
    const employeeMultiplier = 1 + (company.employees_count * 0.1);
    const levelMultiplier = 1 + (company.level * 0.2);
    
    // Regional Synergy Bonuses
    let regionalBonus = 1;
    if (company.region === 'middle_east' && company.resource_type === 'oil') regionalBonus = 1.5;
    if (company.region === 'africa' && company.resource_type === 'gold') regionalBonus = 1.6;
    if (company.region === 'europe' && company.resource_type === 'iron') regionalBonus = 1.3;
    if (company.region === 'asia' && company.resource_type === 'wheat') regionalBonus = 1.5;
    if (company.region === 'east_asia') regionalBonus = 1.15; // Tech bonus applied to all

    return Math.floor(base * employeeMultiplier * levelMultiplier * regionalBonus);
  };

  const getUpgradeCost = (level: number) => {
    return {
      resources: Math.floor(2000 * Math.pow(1.3, level)),
      credits: Math.floor(5000 * Math.pow(1.25, level))
    };
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Industrial Registry</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Global Production Chains</p>
        </div>
        <div className="bg-accent-cyan/10 px-2 py-1 rounded border border-accent-cyan/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></div>
          <span className="text-[10px] font-mono text-accent-cyan uppercase">{regionId.replace('_', ' ')} SECTOR</span>
        </div>
      </div>

      {/* State Owned Sector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/70">Imperial Infrastructure</h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-600 uppercase">State Property</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {govCompanies.map(company => {
            const upCost = getUpgradeCost(company.level);
            return (
              <div key={company.id} className="tech-card p-5 border-white/5 bg-zinc-900/40 relative overflow-hidden group">
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-accent-cyan" />
                      <span className="text-sm font-bold text-white uppercase">{company.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/10 uppercase">{company.resource_type}</span>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1.5 grayscale opacity-60">
                         <Users className="w-3 h-3" />
                         <span className="text-[9px] font-mono">{company.employees_count || 0} Citizens</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-accent-cyan">
                         <TrendingUp className="w-3 h-3" />
                         <span className="text-[9px] font-mono">+{getProduction(company)}/hr Treasury</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="flex items-center gap-1">
                       <span className="text-[9px] font-mono text-zinc-500">LEVEL {company.level}</span>
                       {/* Upgrade button only for owners or authorized admins */}
                       {(userData.is_admin || (!company.is_government && company.owner_id === userData.telegram_id)) && (
                         <button 
                           onClick={() => handleUpgrade(company)}
                           disabled={actionLoading?.includes(company.id)}
                           className="p-1 rounded bg-accent-cyan/10 border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-all"
                           title={`Upgrade: ${upCost.resources} Res + ${upCost.credits} Credits`}
                         >
                           <Hammer className="w-2.5 h-2.5 text-accent-cyan" />
                         </button>
                       )}
                     </div>
                     <button 
                      onClick={() => handleWork(company.id)}
                      disabled={userData.working_at_id === company.id || (userData.working_at_id && userData.working_at_id !== company.id) || actionLoading === company.id}
                      className={`mt-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all
                        ${userData.working_at_id === company.id 
                          ? 'bg-accent-cyan text-black' 
                          : userData.working_at_id 
                            ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed opacity-50'
                            : 'bg-zinc-800 text-white hover:bg-white/10 active:scale-95'}`}
                     >
                       {userData.working_at_id === company.id ? 'STATIONED' : userData.working_at_id ? 'LOCKED' : 'ENLIST'}
                     </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] -rotate-12 transform scale-150">
                   <Shield className="w-24 h-24" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Private Sector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent-orange" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/70">Private Conglomerates</h3>
          </div>
          <button 
            onClick={createPrivateCompany}
            className="flex items-center gap-1 px-3 py-1 bg-accent-orange/10 border border-accent-orange/30 rounded-lg text-accent-orange hover:bg-accent-orange hover:text-black transition-all"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase">Found Company</span>
          </button>
        </div>

        {privateCompanies.length === 0 ? (
          <div className="tech-card p-10 border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
            <Coins className="w-10 h-10 mb-2" />
            <p className="text-[10px] font-mono uppercase">Decentralized industrial network offline</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {privateCompanies.map(company => (
              <div key={company.id} className="tech-card p-5 border-white/5 bg-zinc-900/40 border-l-2 border-l-accent-orange">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white uppercase">{company.name}</span>
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                         <Users className="w-3 h-3" />
                         <span className="text-[9px] font-mono">{company.employees_count || 0} Staff</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-500">
                         <TrendingUp className="w-3 h-3" />
                         <span className="text-[9px] font-mono">+{getProduction(company)}/hr Net</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[9px] font-mono text-accent-orange">Lvl {company.level} · {company.resource_type.toUpperCase()}</span>
                     <button 
                      onClick={() => handleWork(company.id)}
                      disabled={userData.working_at_id === company.id || actionLoading === company.id}
                      className={`mt-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all
                        ${userData.working_at_id === company.id 
                          ? 'bg-accent-orange text-black' 
                          : 'bg-zinc-800 text-white hover:bg-white/10 active:scale-95'}`}
                     >
                       {userData.working_at_id === company.id ? 'EMPLOYED' : 'JOIN SECTOR'}
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tech-card p-6 border-white/5 bg-zinc-900/40">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent-cyan mb-4 flex items-center gap-2">
          <Shield className="w-3 h-3" />
          Empire Sector Protocol
        </h3>
        <div className="space-y-4 text-[10px] font-mono text-zinc-400 uppercase leading-relaxed">
          <p>
            <span className="text-white font-bold">1. Universal Employment:</span> Every citizen MUST be stationed in exactly ONE industrial sector. Once signed, contracts are binding to prevent neural espionage.
          </p>
          <p>
            <span className="text-white font-bold">2. Sovereign Yield:</span> Production from <span className="text-accent-cyan">Imperial Infrastructure</span> is transmitted directly to the National Treasury. Individual workers receive zero direct yield but contribute to the logic of the Hegemony.
          </p>
          <p>
            <span className="text-white font-bold">3. Private Conglomerates:</span> Established for 5 TON. Owners receive all yields after a <span className="text-accent-orange">20% Sovereign Tax</span> is automatically deducted for the Empire.
          </p>
          <p>
            <span className="text-white font-bold">4. Industrial Scaling:</span> Sectors have 100 efficiency levels. Upgrades require massive resource injections and Imperial Credits. Higher levels provide exponential production boosts.
          </p>
        </div>
      </div>
    </div>
  );
}
