'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, ShieldCheck, Box, RefreshCcw, Landmark, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TradeSectionProps {
  userData: any;
  resources: any;
  onTradeSuccess: (update: any) => void;
}

export default function TradeSection({ userData, resources, onTradeSuccess }: TradeSectionProps) {
  const [activeTab, setActiveTab] = useState<'swap'|'p2p'>('swap');
  const [selectedRes, setSelectedRes] = useState('oil');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketOrders, setMarketOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('market_orders')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (data) setMarketOrders(data);
    }
    if (activeTab === 'p2p') fetchOrders();
  }, [activeTab]);

  const handleQuickSwap = async () => {
    if (!amount || parseFloat(amount) <= 0 || loading) return;
    const numAmount = parseFloat(amount);
    
    if (resources[selectedRes] < numAmount) {
      alert("Insufficient Resources.");
      return;
    }

    setLoading(true);
    try {
      // Mock exchange logic based on dashboard price or simple ratio
      // In a real system, this would be an RPC call
      const exchangeRate = 0.0014; // Default exchange to TON
      const yieldTon = numAmount * exchangeRate;

      const { error } = await supabase
        .from('users')
        .update({
          [selectedRes]: resources[selectedRes] - numAmount,
          ton_balance: resources.ton + yieldTon
        })
        .eq('telegram_id', userData.telegram_id);

      if (error) throw error;
      
      onTradeSuccess({ ...resources, [selectedRes]: resources[selectedRes] - numAmount, ton: resources.ton + yieldTon });
      alert(`TRADE SUCCESS: Received ${yieldTon.toFixed(2)} TON`);
      setAmount('');
    } catch (e) {
      console.error(e);
      alert("Transaction Refused by Clearing House.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Trade Hub</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-zinc-500">Secure Sovereign Logistics</p>
        </div>
        <div className="flex bg-zinc-900 border border-white/5 rounded-lg p-0.5">
          <button 
            onClick={() => setActiveTab('swap')}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${activeTab === 'swap' ? 'bg-accent-cyan text-black' : 'text-zinc-500'}`}
          >
            QUICK SWAP
          </button>
          <button 
            onClick={() => setActiveTab('p2p')}
            className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${activeTab === 'p2p' ? 'bg-accent-cyan text-black' : 'text-zinc-500'}`}
          >
            P2P MARKET
          </button>
        </div>
      </div>

      {activeTab === 'swap' ? (
        <div className="tech-card space-y-6 bg-gradient-to-b from-zinc-900/50 to-transparent p-6 border-white/5">
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Input Resource</span>
              <span className="text-[10px] font-mono text-accent-cyan uppercase">Balance: {resources[selectedRes]?.toFixed(2)}</span>
            </div>
            <div className="flex gap-3 h-14">
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 font-mono text-xl text-white outline-none focus:border-accent-cyan/30"
              />
              <select 
                value={selectedRes}
                onChange={(e) => setSelectedRes(e.target.value)}
                className="w-28 bg-zinc-800 border border-white/10 rounded-xl px-2 text-[10px] font-bold uppercase text-white outline-none"
              >
                <option value="oil">OIL</option>
                <option value="gold">GOLD</option>
                <option value="iron">IRON</option>
                <option value="wheat">WHEAT</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-3">
            <div className="w-10 h-10 rounded-full bg-accent-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,255,209,0.4)] z-10">
              <ArrowLeftRight className="w-5 h-5 text-black" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Estimated Recovery</span>
              <span className="text-[10px] font-mono text-accent-cyan">STABLE RATE 0.0014</span>
            </div>
            <div className="flex gap-3 h-14">
              <div className="flex-1 bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl flex items-center px-4 font-mono text-xl text-accent-cyan">
                {amount ? (parseFloat(amount) * 0.0014).toFixed(4) : '0.0000'}
              </div>
              <div className="w-28 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-accent-orange">
                TON
              </div>
            </div>
          </div>

          <button 
            onClick={handleQuickSwap}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(0,255,209,0.2)]
              ${loading ? 'bg-zinc-800 text-zinc-600' : 'bg-accent-cyan text-black hover:brightness-110'}`}
          >
            {loading ? 'CLEARING TRANSACTION...' : 'EXECUTE CONTRACT'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="tech-card p-4 border-dashed border-white/10 flex flex-col items-center justify-center text-center py-10 opacity-60 grayscale">
              <RefreshCcw className="w-8 h-8 text-zinc-600 mb-3 animate-spin duration-[10s]" />
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Global P2P Relay Offline</h3>
              <p className="text-[9px] text-zinc-500 max-w-[200px] leading-relaxed uppercase">Imperial Market Service will engage when region liquidity thresholds are met.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5">
          <Landmark className="w-4 h-4 text-zinc-600" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Sovereign Vault</span>
        </div>
        <div className="bento-card p-4 flex flex-col gap-1 items-center justify-center border-white/5">
           <Coins className="w-4 h-4 text-zinc-600" />
           <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{userData?.region?.replace('_', ' ')} Branch</span>
        </div>
      </div>
    </div>
  );
}
