'use client';

import { TonConnectButton } from '@tonconnect/ui-react';
import { Wallet, Settings, TrendingUp, Map as MapIcon, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RegionSelector from '@/components/dashboard/RegionSelector';
import ReferralSection from '@/components/dashboard/ReferralSection';

export default function Dashboard() {
  const [userName, setUserName] = useState('jdoe_trading');
  const [citizenId, setCitizenId] = useState('8421');
  const [fullUserId, setFullUserId] = useState<string | number>('');
  const [loading, setLoading] = useState(true);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dash');
  const [resources, setResources] = useState({ oil: 0, gold: 0, iron: 0, wheat: 0, ton: 0 });
  
  // Regional modifiers mapping
  const getModifiers = (region: string) => {
    const mods = { oil: 1, gold: 1, iron: 1, wheat: 1 };
    if (region === 'middle_east') mods.oil = 2.5; // High oil yield
    if (region === 'asia') mods.gold = 2.0;       // Industry hub
    if (region === 'africa') mods.iron = 2.2;     // Resource rich
    if (region === 'europe') mods.wheat = 2.1;    // Agricultural base
    return mods;
  };

  useEffect(() => {
    const initUser = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      
      if (user) {
        setUserName(user.username || user.first_name);
        setCitizenId(user.id.toString().slice(-4));
        setFullUserId(user.id);

        const { data, error } = await supabase
          .from('users')
          .upsert({
            telegram_id: user.id,
            username: user.username || `User_${user.id}`,
            last_login: new Date().toISOString(),
          }, { 
            onConflict: 'telegram_id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (data) {
          setUserData(data);
          
          // Calculate Passive Income since last login
          const now = new Date();
          const lastLogin = new Date(data.last_login || data.created_at || now);
          const diffSeconds = Math.max(0, (now.getTime() - lastLogin.getTime()) / 1000);
          
          // Base rate: 0.01 units per second
          const baseRate = 0.01;
          const mods = getModifiers(data.region || '');
          const gain = diffSeconds * baseRate;

          const updatedResources = {
            oil: (data.oil || 0) + (gain * mods.oil),
            gold: (data.gold || 0) + (gain * mods.gold),
            iron: (data.iron || 0) + (gain * mods.iron),
            wheat: (data.wheat || 0) + (gain * mods.wheat),
            ton: data.ton_balance || 0
          };

          setResources(updatedResources);

          // Update DB with the harvested resources
          await supabase.from('users').update({
            oil: updatedResources.oil,
            gold: updatedResources.gold,
            iron: updatedResources.iron,
            wheat: updatedResources.wheat,
            last_login: now.toISOString()
          }).eq('telegram_id', user.id);

          if (!data.region) {
            setShowRegionSelector(true);
          }
        }
      }
      setLoading(false);
    };

    initUser();
  }, []);

  // Live Ticker Logic
  useEffect(() => {
    if (!userData || showRegionSelector) return;

    const interval = setInterval(() => {
      const mods = getModifiers(userData.region || '');
      const rate = 0.01; // 0.01 units per second

      setResources(prev => ({
        ...prev,
        oil: prev.oil + (rate * mods.oil),
        gold: prev.gold + (rate * mods.gold),
        iron: prev.iron + (rate * mods.iron),
        wheat: prev.wheat + (rate * mods.wheat),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [userData, showRegionSelector]);

  const triggerHaptic = () => {
    // @ts-ignore
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const handleRegionSelect = async (regionId: string) => {
    triggerHaptic();
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    // Optimistically close and update UI for better feel
    setShowRegionSelector(false);
    setUserData((prev: any) => ({ ...prev, region: regionId }));

    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ region: regionId })
          .eq('telegram_id', user.id);

        if (error) {
          console.error("Database error saving region:", error);
          // If it failed, we might want to show it again, but for now we keep it closed to not annoy the user
        }
      } catch (err) {
        console.error("Failed to persist region:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-industrial-bg">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  if (showRegionSelector) {
    return <RegionSelector onSelect={handleRegionSelect} />;
  }

  const regions = [
    { name: 'MIDDLE EAST', currency: 'BTM', price: '1.42', change: '+12.4%', color: 'border-accent-cyan/40 bg-accent-cyan/10' },
    { name: 'AFRICA', currency: 'BTF', price: '0.64', change: '-2.1%', color: 'border-border-secondary' },
    { name: 'EUROPE', currency: 'BTE', price: '2.15', change: '+2.1%', color: 'border-border-secondary' },
    { name: 'ASIA', currency: 'BTA', price: '0.88', change: '-4.2%', color: 'border-border-secondary' },
    { name: 'EAST ASIA', currency: 'BTR', price: '1.04', change: '0.0%', color: 'border-border-secondary' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto industrial-grid p-6 space-y-6">
        {activeTab === 'dash' ? (
          <>
            {/* Header Profile */}
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue border border-accent-cyan/30 flex items-center justify-center font-bold text-black uppercase">
                  {userName ? userName.slice(0, 2) : '??'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1">Citizen #{citizenId}</span>
                  <span className="text-sm font-semibold tracking-tight truncate">@{userName || 'Citizen'}</span>
                </div>
              </div>
              <div className="bg-[#151518] border border-border-main px-3 py-1.5 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Live Network</span>
              </div>
            </header>

            {/* Vault Balance Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="tech-card space-y-4"
            >
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Vault Balance</span>
                  <span className="text-2xl font-black text-accent-orange tracking-tight">
                    {resources.ton.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={triggerHaptic}
                    className="bg-accent-orange text-black text-[10px] font-bold px-3 py-2 rounded-lg hover:after:content-[''] hover:brightness-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(255,145,0,0.3)]"
                  >
                    DEPOSIT
                  </button>
                  <button 
                    onClick={triggerHaptic}
                    className="border border-border-secondary text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-white/5 active:scale-90 transition-all"
                  >
                    OUT
                  </button>
                </div>
              </div>
              
              {/* Resource Items */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border-main">
                <button onClick={triggerHaptic} className="text-center group active:scale-95 transition-transform">
                  <div className="text-[9px] text-gray-600 mb-1 group-hover:text-zinc-400 transition-colors">OIL</div>
                  <div className="text-xs font-mono text-accent-cyan">{resources.oil.toFixed(1)}</div>
                </button>
                <button onClick={triggerHaptic} className="text-center group active:scale-95 transition-transform">
                  <div className="text-[9px] text-gray-600 mb-1 group-hover:text-zinc-400 transition-colors">GLD</div>
                  <div className="text-xs font-mono text-accent-cyan">{resources.gold.toFixed(1)}</div>
                </button>
                <button onClick={triggerHaptic} className="text-center group active:scale-95 transition-transform">
                  <div className="text-[9px] text-gray-600 mb-1 group-hover:text-zinc-400 transition-colors">IRN</div>
                  <div className="text-xs font-mono text-accent-cyan">{resources.iron.toFixed(1)}</div>
                </button>
                <button onClick={triggerHaptic} className="text-center group active:scale-95 transition-transform">
                  <div className="text-[9px] text-gray-600 mb-1 group-hover:text-zinc-400 transition-colors">WHT</div>
                  <div className="text-xs font-mono text-accent-cyan">{resources.wheat.toFixed(1)}</div>
                </button>
              </div>
            </motion.div>

            {/* Market Quotations */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Economic Zones</h3>
                <button onClick={() => { setActiveTab('market'); triggerHaptic(); }} className="text-[10px] text-accent-cyan font-mono opacity-80 hover:opacity-100 transition-opacity">VIEW ALL</button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {regions.slice(0, 4).map((region, i) => (
                  <motion.button
                    key={region.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setActiveTab('market'); triggerHaptic(); }}
                    className="bg-[#111114] border border-border-main p-3 rounded-2xl relative overflow-hidden group text-left active:scale-95 transition-all"
                  >
                    <div className="text-[9px] text-gray-500 font-mono mb-1">{region.currency} - {region.name}</div>
                    <div className="text-lg font-bold group-hover:text-accent-cyan transition-colors">{region.price} TON</div>
                    <div className={`text-[9px] font-mono ${region.change.startsWith('+') ? 'text-emerald-500' : region.change === '0.0%' ? 'text-gray-400' : 'text-red-500'}`}>
                      {region.change}
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-12 h-12 border border-border-secondary rounded-full opacity-5 group-hover:opacity-20 transition-opacity"></div>
                  </motion.button>
                ))}
              </div>

              {/* Africa Special Row */}
              <div className="bg-[#111114] border border-border-main p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-[9px] text-gray-500 font-mono mb-1">BTF - AFRICA</div>
                  <div className="text-lg font-bold">0.64 TON</div>
                </div>
                <div className="flex gap-1 items-end">
                  <div className="w-1 h-3 bg-border-secondary"></div>
                  <div className="w-1 h-5 bg-accent-cyan/60"></div>
                  <div className="w-1 h-2 bg-border-secondary"></div>
                  <div className="w-1 h-4 bg-accent-cyan"></div>
                  <div className="w-1 h-6 bg-accent-cyan/80"></div>
                </div>
              </div>
            </section>

            {/* Strategic Map View */}
            <section className="space-y-4 pb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Strategic Map</h3>
              <div className="grid grid-cols-5 gap-1.5 h-16">
                {regions.map((region, i) => (
                  <div 
                    key={region.currency}
                    className={`rounded-lg border flex items-center justify-center text-[9px] font-bold transition-all
                      ${region.name === 'MIDDLE EAST' 
                        ? 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan shadow-[0_0_10px_rgba(0,255,209,0.2)]' 
                        : 'bg-[#151518] border-border-secondary text-gray-600'
                      }`}
                  >
                    {region.currency}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : activeTab === 'invite' ? (
          <ReferralSection userId={fullUserId} />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">MODULE UNDER CONSTRUCTION</div>
        )}
      </div>

      {/* Navigation Bar */}
      <nav className="h-24 pb-6 bg-industrial-card border-t border-border-main flex items-center justify-around px-4 shrink-0 z-50">
        <button 
          onClick={() => { setActiveTab('dash'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'dash' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'dash' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">DASH</span>
        </button>
        <button 
          onClick={() => { setActiveTab('market'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'market' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'market' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">MARKET</span>
        </button>
        <button 
          onClick={() => { setActiveTab('trade'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'trade' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'trade' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">TRADE</span>
        </button>
        <button 
          onClick={() => { setActiveTab('tasks'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'tasks' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'tasks' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">TASKS</span>
        </button>
        <button 
          onClick={() => { setActiveTab('invite'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'invite' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'invite' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">INVITE</span>
        </button>
      </nav>
    </div>
  );
}
