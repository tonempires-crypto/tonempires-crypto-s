'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, ShieldCheck, Box, RefreshCcw, Landmark, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getGlobalMarketPrices } from '@/lib/marketUtils';
import { useTranslation } from 'react-i18next';

interface TradeSectionProps {
  userData: any;
  resources: any;
  onTradeSuccess: (update: any) => void;
}

export default function TradeSection({ userData, resources, onTradeSuccess }: TradeSectionProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'swap'|'p2p'>('swap');
  const [swapDirection, setSwapDirection] = useState<'ton_to_local' | 'local_to_ton'>('ton_to_local');
  const [selectedRes, setSelectedRes] = useState('oil');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketOrders, setMarketOrders] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState<any>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [marketPrices, setMarketPrices] = useState<any>(null);

  useEffect(() => {
    async function fetchOrdersAndPrices() {
      // Fetch prices first as they are critical for UI
      try {
        const pricesRes = await getGlobalMarketPrices();
        if (pricesRes) setMarketPrices(pricesRes);
      } catch (e) {
        console.error("Price fetch error:", e);
      }

      // Fetch orders independently
      try {
        const { data, error } = await supabase
          .from('market_orders')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setMarketOrders(data);
      } catch (e) {
        console.error("Market orders fetch error:", e);
      }
    }
    
    if (activeTab === 'p2p') {
      fetchOrdersAndPrices();
      const interval = setInterval(fetchOrdersAndPrices, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchStats() {
      if (!userData?.region) return;
      try {
        const { data: r } = await supabase.from('regions').select('total_ton_deposited').eq('id', userData.region).single();
        const { data: s } = await supabase.from('regional_stats').select('*').eq('region', userData.region).maybeSingle();
        if (r && s) {
          setRegionStats({ ...s, ton_deposited: r.total_ton_deposited || 0 });
        }
      } catch (e) {
        console.error("Stats fetch error:", e);
      }
    }
    fetchStats();
  }, [userData?.region]);

  const getExchangeRate = () => {
    if (!regionStats) return 0.0001;
    const circ = regionStats.total_circulation || 0;
    const ton = regionStats.ton_deposited || 0;
    const pop = regionStats.population || 1;
    
    // Price Formula: (Total TONs deposited / Total Circulation) * (population * 0.01)
    // This defines TON per 1 LOCAL CURRENCY unit (Value backing each coin)
    const rawPrice = circ > 0 ? ton / circ : 0.0001;
    const rate = rawPrice * pop * 0.01;
    return rate || 0.0001; // Minimum floor to prevent division by zero
  };

  const handleQuickSwap = async () => {
    if (!amount || parseFloat(amount) <= 0 || loading) return;
    const numAmount = parseFloat(amount);
    const rate = getExchangeRate();
    
    setLoading(true);
    try {
      if (swapDirection === 'ton_to_local') {
        if (numAmount < 1) throw new Error("Minimum swap is 1 TON");
        if (resources.ton < numAmount) throw new Error("Insufficient TON in vault");

        const yieldLocal = numAmount / rate;
        
        // 1. Update User
        const { error: uErr } = await supabase.from('users').update({
          ton_balance: resources.ton - numAmount,
          local_currency_balance: resources.localCurrency + yieldLocal
        }).eq('telegram_id', userData.telegram_id);
        if (uErr) throw uErr;

        // 2. Update Circulation
        await supabase.from('regional_stats')
          .update({ total_circulation: (regionStats?.total_circulation || 0) + yieldLocal })
          .eq('region', userData.region);

        onTradeSuccess({ ...resources, ton: resources.ton - numAmount, localCurrency: resources.localCurrency + yieldLocal });
        alert(`CONVERSION SUCCESS: Received ${yieldLocal.toFixed(2)} Credits. Local economy expanded.`);
      } 
      else if (swapDirection === 'local_to_ton') {
        const yieldTon = numAmount * rate;
        if (yieldTon < 1) throw new Error("Minimum output must be 1 TON");
        if (resources.localCurrency < numAmount) throw new Error("Insufficient Local Currency");

        // 1. Update User
        const { error: uErr } = await supabase.from('users').update({
          ton_balance: resources.ton + yieldTon,
          local_currency_balance: resources.localCurrency - numAmount
        }).eq('telegram_id', userData.telegram_id);
        if (uErr) throw uErr;

        // 2. Update Circulation (Burn)
        await supabase.from('regional_stats')
          .update({ total_circulation: Math.max(0, (regionStats?.total_circulation || 0) - numAmount) })
          .eq('region', userData.region);

        onTradeSuccess({ ...resources, ton: resources.ton + yieldTon, localCurrency: resources.localCurrency - numAmount });
        alert(`LIQUIDATION SUCCESS: Received ${yieldTon.toFixed(2)} TON. Credits burned from circulation.`);
      }

      setAmount('');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Transaction Refused by Clearing House.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!sellAmount || loading) return;
    const numAmount = parseFloat(sellAmount);
    
    const currentPrice = marketPrices?.[selectedRes] || 0;
    if (currentPrice <= 0) {
      alert("MARKET OFFLINE: Local price data unavailable.");
      return;
    }

    const totalPrice = numAmount * currentPrice;

    if (resources[selectedRes] < numAmount) {
      alert("IMPERIAL AUDIT: Insufficient resources to back this contract.");
      return;
    }

    setLoading(true);
    try {
      const { error: resErr } = await supabase.from('user_resources').update({
        [selectedRes]: resources[selectedRes] - numAmount
      }).eq('telegram_id', userData.telegram_id);

      if (resErr) throw resErr;

      const { error: orderErr } = await supabase.from('market_orders').insert({
        seller_id: userData.telegram_id,
        seller_region: userData.region,
        resource_type: selectedRes,
        amount: numAmount,
        price_ton: totalPrice,
        status: 'active'
      });

      if (orderErr) throw orderErr;

      alert("CONSIGNMENT LOGGED: Order is now visible across all empire relays.");
      setSellAmount('');
      onTradeSuccess({ ...resources, [selectedRes]: resources[selectedRes] - numAmount });
    } catch (e: any) {
      console.error(e);
      alert("Registry Error: " + (e.message || "Unknown Failure"));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyOrder = async (order: any) => {
    if (loading) return;
    if (resources.ton < order.price_ton) {
      alert("TON BALANCE CRITICALLY LOW: Exchange denied.");
      return;
    }

    if (order.seller_id === userData.telegram_id) {
      alert("LOGIC ERROR: You cannot buy your own consignment.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('process_market_purchase', {
        p_buyer_id: userData.telegram_id,
        p_order_id: order.id,
        p_price: order.price_ton,
        p_amount: order.amount,
        p_resource: order.resource_type
      });

      if (error) throw error;

      alert(`LOGISTICS COMPLETED: ${order.amount} ${order.resource_type.toUpperCase()} retrieved from Global Relay.`);
      onTradeSuccess({ 
        ...resources, 
        ton: resources.ton - order.price_ton, 
        [order.resource_type]: (resources[order.resource_type] || 0) + order.amount 
      });
    } catch (e: any) {
      console.error(e);
      alert("Purchase failed: " + (e.message || "Sovereign node timeout"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, amount: number, resType: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('market_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('seller_id', userData.telegram_id);
      
      if (error) throw error;

      await supabase.from('user_resources').update({
        [resType]: (resources[resType] || 0) + amount
      }).eq('telegram_id', userData.telegram_id);

      onTradeSuccess({ ...resources, [resType]: (resources[resType] || 0) + amount });
      alert("ORDER RECALLED: Resources returned to stash.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">{t('trade.hub')}</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-zinc-500">{t('trade.safe_logistics')}</p>
        </div>
        <div className="flex bg-zinc-900 border border-white/5 rounded-lg p-0.5">
          <button 
            onClick={() => setActiveTab('swap')}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${activeTab === 'swap' ? 'bg-accent-cyan text-black' : 'text-zinc-500'}`}
          >
            {t('trade.quick_swap')}
          </button>
          <button 
            onClick={() => setActiveTab('p2p')}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${activeTab === 'p2p' ? 'bg-accent-cyan text-black' : 'text-zinc-500'}`}
          >
            {t('trade.p2p_market')}
          </button>
        </div>
      </div>

      {activeTab === 'swap' ? (
        <div className="tech-card space-y-6 bg-gradient-to-b from-zinc-900/50 to-transparent p-6 border-white/5">
          <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
            {[
              { id: 'ton_to_local', label: 'TON > LOCAL' },
              { id: 'local_to_ton', label: 'LOCAL > TON' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { setSwapDirection(opt.id as any); setAmount(''); }}
                className={`flex-1 py-1.5 rounded-md text-[8px] font-black uppercase transition-all
                  ${swapDirection === opt.id ? 'bg-accent-cyan text-black' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('trade.input_amount')}</span>
              <span className="text-[10px] font-mono text-accent-cyan uppercase">
                Bal: {swapDirection === 'ton_to_local' ? resources.ton?.toFixed(5) : 
                      resources.localCurrency?.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3 h-14">
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 font-mono text-xl text-white outline-none focus:border-accent-cyan/30"
              />
              <div className="w-28 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center font-bold text-[10px] text-zinc-400 uppercase">
                {swapDirection === 'ton_to_local' ? 'TON' : 'LOCAL'}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-3">
            <div className="w-10 h-10 rounded-full bg-accent-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,255,209,0.4)] z-10">
              <ArrowLeftRight className="w-5 h-5 text-black" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('trade.est_recovery')}</span>
              <span className="text-[10px] font-mono text-accent-cyan uppercase">
                Rate: {swapDirection === 'ton_to_local' ? (1/getExchangeRate()).toFixed(5) + ' L/T' : 
                       getExchangeRate().toFixed(5) + ' T/L'}
              </span>
            </div>
            <div className="flex gap-3 h-14">
              <div className="flex-1 bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl flex items-center px-4 font-mono text-xl text-accent-cyan">
                {amount ? (
                  swapDirection === 'ton_to_local' ? (parseFloat(amount) / getExchangeRate()).toFixed(2) :
                  (parseFloat(amount) * getExchangeRate()).toFixed(5)
                ) : '0.0000'}
              </div>
              <div className="w-28 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-accent-orange">
                {swapDirection === 'ton_to_local' ? 'LOCAL' : 'TON'}
              </div>
            </div>
          </div>

          <button 
            onClick={handleQuickSwap}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(0,255,209,0.2)]
              ${loading ? 'bg-zinc-800 text-zinc-600' : 'bg-accent-cyan text-black hover:brightness-110'}`}
          >
            {loading ? t('trade.clearing') : t('trade.execute_contract')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CREATE SELL ORDER */}
          <div className="tech-card bg-zinc-900/50 p-5 border-white/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-tighter text-accent-cyan mb-2">{t('trade.init_sell')}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase px-1">{t('nav.resources')}</span>
                <select 
                  value={selectedRes}
                  onChange={(e) => setSelectedRes(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg h-10 px-2 text-[10px] font-bold uppercase text-white outline-none"
                >
                  <option value="oil">{t('dash.resources.oil').toUpperCase()}</option>
                  <option value="gold">{t('dash.resources.gold').toUpperCase()}</option>
                  <option value="iron">{t('dash.resources.iron').toUpperCase()}</option>
                  <option value="wheat">{t('dash.resources.wheat').toUpperCase()}</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase px-1">Amount</span>
                <input 
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/5 rounded-lg h-10 px-3 font-mono text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Current Market Value</span>
                <span className="text-[10px] font-mono text-accent-cyan font-bold">
                  {((marketPrices?.[selectedRes] || 0) * 100000).toFixed(5)} TON / 100k
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Estimated Yield</span>
                <span className="text-[12px] font-mono text-white font-black">
                  {(parseFloat(sellAmount || '0') * (marketPrices?.[selectedRes] || 0)).toFixed(5)} TON
                </span>
              </div>
            </div>

            <button 
              onClick={handleCreateOrder}
              disabled={loading || !sellAmount}
              className="w-full py-3 bg-zinc-800 hover:bg-white/5 text-white border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {t('trade.post_exchange')}
            </button>
          </div>

          {/* GLOBAL MARKET FEED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-400">{t('trade.global_feed')}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Live Relays</span>
              </div>
            </div>

            {marketOrders.length === 0 ? (
              <div className="tech-card p-10 flex flex-col items-center justify-center border-dashed border-white/5 grayscale">
                <Box className="w-6 h-6 text-zinc-700 mb-2" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase">{t('trade.no_consignments')}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {marketOrders.map(order => (
                  <div key={order.id} className="tech-card bg-black/40 p-3 border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                         <span className="text-[10px] font-black text-accent-orange uppercase">{order.resource_type.slice(0, 1)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-white uppercase">{order.amount} {order.resource_type}</span>
                          <span className="text-[8px] font-mono bg-white/5 px-1 rounded border border-white/10 text-zinc-400 uppercase">{order.seller_region?.replace('_', ' ')}</span>
                        </div>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">Price: {order.price_ton} TON</p>
                      </div>
                    </div>
                    
                    {order.seller_id === userData.telegram_id ? (
                      <button 
                        onClick={() => handleCancelOrder(order.id, order.amount, order.resource_type)}
                        className="px-3 py-2 bg-red-950/30 border border-red-500/20 text-red-500 text-[9px] font-black rounded-lg uppercase"
                      >
                        {t('trade.recall')}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuyOrder(order)}
                        className="px-4 py-2 bg-accent-cyan text-black text-[9px] font-black rounded-lg uppercase shadow-[0_0_15px_rgba(0,255,209,0.2)]"
                      >
                        {t('trade.buy')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5">
          <Landmark className="w-4 h-4 text-zinc-600" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t('dash.personal_vault').split(' (')[0]}</span>
        </div>
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5">
           <Coins className="w-4 h-4 text-zinc-600" />
           <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{userData?.region?.replace('_', ' ')} {t('trade.branch')}</span>
        </div>
      </div>
    </div>
  );
}
