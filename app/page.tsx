'use client';

import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet, Settings, TrendingUp, Map as MapIcon, ChevronRight, Zap, Loader2, CreditCard, Factory } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RegionSelector from '@/components/dashboard/RegionSelector';
import ReferralSection from '@/components/dashboard/ReferralSection';
import MarketSection from '@/components/dashboard/MarketSection';
import TradeSection from '@/components/dashboard/TradeSection';
import TasksSection from '@/components/dashboard/TasksSection';
import ProfileSection from '@/components/dashboard/ProfileSection';
import RegionEconomySection from '@/components/dashboard/RegionEconomySection';
import GovernmentSection from '@/components/dashboard/GovernmentSection';
import CompaniesSection from '@/components/dashboard/CompaniesSection';

export default function Dashboard() {
  const [userName, setUserName] = useState('jdoe_trading');
  const [citizenId, setCitizenId] = useState('8421');
  const [fullUserId, setFullUserId] = useState<string | number>('');
  const [loading, setLoading] = useState(true);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dash');
  const [resources, setResources] = useState({ oil: 0, gold: 0, iron: 0, wheat: 0, ton: 0, localCurrency: 0 });
  const [referralCount, setReferralCount] = useState(0);
  const [tonConnectUI] = useTonConnectUI();
  
  const ADMIN_WALLET = "UQCWOWCOQULzFdZttBaH3iUJyue51OEYvRhbCaitE4ktTxO4";

  const handleDeposit = async () => {
    triggerHaptic();
    const amount = prompt("Enter amount of TON to deposit:");
    if (!amount || isNaN(parseFloat(amount))) return;

    const nanoAmount = (parseFloat(amount) * 1000000000).toString();

    if (!tonConnectUI.connected) {
      await tonConnectUI.connectWallet();
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: ADMIN_WALLET,
            amount: nanoAmount,
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);
      
      // OPTIMISTIC SYNC: Update balance in DB immediately after wallet confirmation
      const newBalance = resources.ton + parseFloat(amount);
      const { error: updateError } = await supabase
        .from('users')
        .update({ ton_balance: newBalance })
        .eq('telegram_id', fullUserId);

      if (!updateError) {
        setResources(prev => ({ ...prev, ton: newBalance }));
        alert(`SUCCESS: ${amount} TON credited to your Imperial Vault.`);
      } else {
        console.error("DB Sync Error:", updateError);
        alert("Transaction confirmed on-chain, but registry sync failed. Please refresh.");
      }
    } catch (e) {
      console.error("Deposit failed", e);
      // Don't alert on user cancel, only on real errors
      if (e instanceof Error && !e.message.includes('User rejected')) {
        alert("Transfer Error: The Treasury could not process the request.");
      }
    }
  };
  
  // Regional modifiers mapping
  const getMiningRates = (region: string) => {
    const rates = { oil: 0.005, gold: 0.005, iron: 0.005, wheat: 0.005 };
    if (region === 'middle_east') rates.oil = 0.025; 
    if (region === 'asia') rates.gold = 0.020;       
    if (region === 'africa') rates.iron = 0.022;     
    if (region === 'europe') rates.wheat = 0.021;    
    return rates;
  };

  useEffect(() => {
    const initUser = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      let user = tg?.initDataUnsafe?.user;

      // DEV MOCK: If no telegram user, use a fixed one for testing in browser
      if (!user && process.env.NODE_ENV === 'development') {
        user = { id: 1492586846, username: 'dev_user', first_name: 'Dev' };
      }

      if (user) {
        tg?.ready();
        setUserName(user.username || user.first_name || 'Citizen');
        setCitizenId(user.id.toString().slice(-4));
        setFullUserId(user.id);

        // 1. UPSCALE: Check if user exists.
        const { data: users, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', user.id)
          .order('region', { ascending: false }) 
          .limit(1);

        if (fetchError) console.error("Error fetching user:", fetchError);

        const data = users?.[0];

          if (data) {
          setUserData(data);
          
          // Fetch Real Private Resources from user_resources table
          let { data: resData, error: resError } = await supabase
            .from('user_resources')
            .select('*')
            .eq('telegram_id', user.id)
            .maybeSingle();

          // AUTO-INITIALIZE: If user_resources is missing, create it to prevent the "Zero" bug
          if (!resData && !resError) {
             const { data: createdRes } = await supabase
               .from('user_resources')
               .insert({ 
                 telegram_id: user.id,
                 oil: 0, gold: 0, iron: 0, wheat: 0 
               })
               .select()
               .maybeSingle();
             resData = createdRes;
          }

          setResources({
            oil: resData?.oil || 0,
            gold: resData?.gold || 0,
            iron: resData?.iron || 0,
            wheat: resData?.wheat || 0,
            ton: data.ton_balance || 0,
            localCurrency: data.local_currency_balance || 0
          });

          // GLOBAL PRODUCTION PULSE: Trigger once to update registries
          try {
            await supabase.rpc('process_all_empire_production');
            const { data: regions } = await supabase.from('regions').select('id');
            if (regions) {
              for (const r of regions) {
                await supabase.rpc('sync_state_production', { p_region_id: r.id });
              }
            }
          } catch (syncErr) {
            console.error("Pulse Sync Failure:", syncErr);
          }
          
          if (data.region && data.region !== '') {
            setShowRegionSelector(false);
          } else {
            setShowRegionSelector(true);
          }
        } else {
          // Create user if not found
          const startParam = tg?.initDataUnsafe?.start_param;
          const referralInfo = startParam ? parseInt(startParam) : null;

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .upsert({
              telegram_id: user.id,
              username: user.username || `User_${user.id}`,
              ton_balance: 0,
              referred_by: referralInfo,
              last_login: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }, { onConflict: 'telegram_id' })
            .select()
            .maybeSingle();
          
          if (newUser) {
            setUserData(newUser);
            setShowRegionSelector(true);
          } else if (insertError) {
            console.error("Critical: Initial user upsert failed", insertError);
          }
        }
      } else {
        console.warn("No Telegram user and not in dev mode. App will be limited.");
      }
      setLoading(false);
    };

    initUser();
  }, []);

  // Removed Live Ticker Logic - Mining is now a button in ProfileSection

  const [regionalMarketData, setRegionalMarketData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const { data: regions } = await supabase.from('regions').select('*');
        const { data: stats } = await supabase.from('regional_stats').select('*');
        
        if (regions) {
          const formatted = regions.map(r => {
            const s = stats?.find(stat => stat.region === r.id);
            const pop = s?.population || 0;
            const circ = s?.total_circulation || 0;
            const ton = r.total_ton_deposited || 0;
            
            // Price Formula: Max(1, (Circulation / TON)) * population * 0.01
            const rawPrice = ton > 0 ? circ / ton : 1;
            const basePrice = Math.max(1, rawPrice);
            const finalPrice = basePrice * pop * 0.01;
            
            let currency = 'BTX';
            if (r.id === 'middle_east') currency = 'BTM';
            if (r.id === 'africa') currency = 'BTF';
            if (r.id === 'europe') currency = 'BTE';
            if (r.id === 'asia') currency = 'BTA';
            if (r.id === 'east_asia') currency = 'BTR';

            return {
              id: r.id,
              name: r.name,
              currency,
              ton_balance: ton,
              price: finalPrice,
              change: '0.0%' 
            };
          });
          setRegionalMarketData(formatted);
        }
      } catch (err) {
        console.error("Dashboard market sync failed", err);
      }
    }
    fetchMarketData();
  }, []);

  const triggerHaptic = () => {
    // @ts-ignore
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const handleRegionSelect = async (regionId: string) => {
    if (!userData || !fullUserId) {
      console.error("Missing userData or fullUserId during region selection", { userData, fullUserId });
      return;
    }
    triggerHaptic();
    
    // Hard Lock: Force update record
    console.log(`Attempting to set region ${regionId} for user ${fullUserId}`);
    const { error } = await supabase
      .from('users')
      .update({ 
        region: regionId,
        last_login: new Date().toISOString() 
      })
      .eq('telegram_id', fullUserId);

    if (!error) {
      console.log(`Region confirmed in DB: ${regionId}`);
      setUserData((prev: any) => ({ ...prev, region: regionId }));
      setShowRegionSelector(false);
      
      // Double verify sync
      const { data: verifiedUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', fullUserId)
        .maybeSingle();
        
      if (verifiedUser) {
        setUserData(verifiedUser);
      }
    } else {
      console.error("CRITICAL: Failed to save region selection to Supabase", error);
      // More professional error message
      alert("Imperial Registry Error: The database refused the update. Please ensure the 'users_region_check' constraint is removed in Supabase SQL Editor.");
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


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto industrial-grid p-6 space-y-6">
        {activeTab === 'dash' ? (
          <>
            {/* Header Profile */}
            <header className="flex items-center justify-between">
              <button 
                onClick={() => { setActiveTab('profile'); triggerHaptic(); }}
                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue border border-accent-cyan/30 flex items-center justify-center font-bold text-black uppercase">
                  {userName ? userName.slice(0, 2) : '??'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1">Citizen #{citizenId}</span>
                  <span className="text-sm font-semibold tracking-tight truncate">@{userName || 'Citizen'}</span>
                </div>
              </button>
              <div className="bg-[#151518] border border-border-main px-3 py-1.5 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Live Network</span>
              </div>
            </header>

            {/* Vault Balance Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="tech-card space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-24 h-24" />
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Personal Vault (Reserved)</span>
                  <span className="text-2xl font-black text-accent-orange tracking-tight">
                    {resources.ton.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeposit}
                    className="bg-accent-orange text-black text-[10px] font-bold px-3 py-2 rounded-lg hover:brightness-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(255,145,0,0.3)] flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    DEPOSIT
                  </button>
                </div>
              </div>

              {/* Resource Items (Stored in DB) */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border-main">
                <div className="text-center group">
                  <div className="text-[9px] text-gray-600 mb-1">OIL</div>
                  <div className={`text-xs font-mono ${(resources.oil || 0) > 0 ? 'text-accent-cyan' : 'text-zinc-700'}`}>
                    {(resources.oil || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-[9px] text-gray-600 mb-1">GOLD</div>
                  <div className={`text-xs font-mono ${(resources.gold || 0) > 0 ? 'text-accent-cyan' : 'text-zinc-700'}`}>
                    {(resources.gold || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-[9px] text-gray-600 mb-1">IRON</div>
                  <div className={`text-xs font-mono ${(resources.iron || 0) > 0 ? 'text-accent-cyan' : 'text-zinc-700'}`}>
                    {(resources.iron || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-[9px] text-gray-600 mb-1">WHEAT</div>
                  <div className={`text-xs font-mono ${(resources.wheat || 0) > 0 ? 'text-accent-cyan' : 'text-zinc-700'}`}>
                    {(resources.wheat || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Strategic Hint */}
            <div className="p-3 bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl">
              <p className="text-[10px] text-accent-cyan italic text-center">
                Citizens stationed in Companies produce resources for the { (userData?.region || 'Empire').replace('_', ' ').toUpperCase() } Treasury.
              </p>
            </div>


              {/* Market Quotations */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Economic Zones</h3>
                  <button onClick={() => { setActiveTab('market'); triggerHaptic(); }} className="text-[10px] text-accent-cyan font-mono opacity-80 hover:opacity-100 transition-opacity">VIEW ALL</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {(regionalMarketData.length > 0 ? regionalMarketData : []).slice(0, 5).map((region, i) => (
                    <motion.button
                      key={region.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setActiveTab('market'); triggerHaptic(); }}
                      className="bg-[#111114] border border-border-main p-3 rounded-2xl relative overflow-hidden group text-left active:scale-95 transition-all"
                    >
                      <div className="text-[9px] text-gray-500 font-mono mb-1">{region.currency} - {region.name.toUpperCase()}</div>
                      <div className="text-lg font-bold group-hover:text-accent-cyan transition-colors">{region.price.toFixed(4)} TON</div>
                      <div className={`text-[9px] font-mono ${region.change.startsWith('+') ? 'text-emerald-500' : region.change === '0.0%' ? 'text-gray-400' : 'text-red-500'}`}>
                        {region.change}
                      </div>
                      <div className="absolute -right-2 -bottom-2 w-12 h-12 border border-border-secondary rounded-full opacity-5 group-hover:opacity-20 transition-opacity"></div>
                    </motion.button>
                  ))}
                </div>

                {/* Regional Highlight Row */}
                <div className="bg-[#111114] border border-border-main p-3 rounded-2xl flex items-center justify-between">
                  {regionalMarketData.find(r => r.id === (userData?.region || 'middle_east')) ? (
                    <>
                      <div className="flex flex-col">
                        <div className="text-[9px] text-gray-500 font-mono mb-1">
                          {regionalMarketData.find(r => r.id === (userData?.region || 'middle_east'))?.currency} - CURRENT SECTOR
                        </div>
                        <div className="text-lg font-bold">
                          {regionalMarketData.find(r => r.id === (userData?.region || 'middle_east'))?.price.toFixed(4)} TON
                        </div>
                      </div>
                      <div className="flex gap-1 items-end">
                        <div className="w-1 h-3 bg-border-secondary"></div>
                        <div className="w-1 h-5 bg-accent-cyan/60"></div>
                        <div className="w-1 h-2 bg-border-secondary"></div>
                        <div className="w-1 h-4 bg-accent-cyan"></div>
                        <div className="w-1 h-6 bg-accent-cyan/80"></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-zinc-600 font-mono italic">Synchronizing tactical data...</div>
                  )}
                </div>
              </section>

            {/* Strategic Map View */}
            <section className="space-y-4 pb-8">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Strategic Map</h3>
                <button 
                  onClick={() => { setActiveTab('economy'); triggerHaptic(); }}
                  className="text-[10px] text-accent-cyan font-mono uppercase tracking-widest hover:brightness-125 transition-all"
                >
                  Regional Intel
                </button>
              </div>
              <button 
                onClick={() => { setActiveTab('economy'); triggerHaptic(); }}
                className="grid grid-cols-5 gap-1.5 h-16 w-full group active:scale-[0.98] transition-all"
              >
                {regionalMarketData.map((region, i) => (
                  <div 
                    key={region.id}
                    className={`rounded-lg border flex items-center justify-center text-[9px] font-bold transition-all
                      ${region.id === (userData?.region) 
                        ? 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan shadow-[0_0_10px_rgba(0,255,209,0.2)]' 
                        : 'bg-[#151518] border-border-secondary text-gray-600'
                      }`}
                  >
                    {region.currency}
                  </div>
                ))}
              </button>
            </section>
          </>
        ) : activeTab === 'market' ? (
          <MarketSection />
        ) : activeTab === 'trade' ? (
          <TradeSection 
            userData={userData}
            resources={resources}
            onTradeSuccess={(newRes) => setResources(newRes)}
          />
        ) : activeTab === 'tasks' ? (
          <TasksSection />
        ) : activeTab === 'invite' ? (
          <ReferralSection userId={fullUserId} />
        ) : activeTab === 'profile' ? (
          <ProfileSection 
            userData={userData} 
            resources={resources} 
            miningRates={getMiningRates(userData?.region || '')} 
            onClaimSuccess={(newRes) => {
              setResources(newRes);
              setUserData((prev: any) => ({ ...prev, last_claim: new Date().toISOString() }));
            }}
          />
        ) : activeTab === 'companies' ? (
          <CompaniesSection 
            userData={userData}
            resources={resources}
          />
        ) : activeTab === 'gov' ? (
          <GovernmentSection 
            userData={userData}
            resources={resources}
          />
        ) : activeTab === 'economy' ? (
          <RegionEconomySection regionId={userData?.region || 'middle_east'} />
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
          onClick={() => { setActiveTab('companies'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'companies' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'companies' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}>
            <Factory className={`w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${activeTab === 'companies' ? 'text-black' : 'text-zinc-500'}`} />
          </div>
          <span className="text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap">Industry</span>
        </button>
        <button 
          onClick={() => { setActiveTab('gov'); triggerHaptic(); }}
          className={`group flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'gov' ? 'text-accent-cyan' : 'text-zinc-500'}`}
        >
          <div className={`w-5 h-5 rounded-sm transition-all duration-300 ${activeTab === 'gov' ? 'bg-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.6)]' : 'border border-zinc-600'}`}></div>
          <span className="text-[9px] font-bold tracking-tighter">EMPIRE</span>
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
