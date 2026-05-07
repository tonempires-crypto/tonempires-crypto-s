'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, BarChart3, Zap, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGlobalMarketPrices, PRICE_LOT_SIZE } from '@/lib/marketUtils';

export default function MarketSection() {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarketDynamics() {
      try {
        const prices = await getGlobalMarketPrices();
        
        if (prices) {
          const dynamicData = [
            { 
              name: 'OIL', 
              price: (prices.oil * PRICE_LOT_SIZE).toFixed(2), 
              change: (Math.random() * 2 - 1).toFixed(1) + '%', 
              trend: Math.random() > 0.5 ? 'up' : 'down', 
              volume: (Math.random() * 5 + 1).toFixed(1) + 'M' 
            },
            { 
              name: 'GOLD', 
              price: (prices.gold * PRICE_LOT_SIZE).toFixed(2), 
              change: (Math.random() * 2 - 1).toFixed(1) + '%', 
              trend: Math.random() > 0.7 ? 'up' : 'down', 
              volume: (Math.random() * 10 + 5).toFixed(0) + 'k' 
            },
            { 
              name: 'IRON', 
              price: (prices.iron * PRICE_LOT_SIZE).toFixed(2), 
              change: (Math.random() * 2 - 1).toFixed(1) + '%', 
              trend: Math.random() > 0.4 ? 'up' : 'down', 
              volume: (Math.random() * 3 + 1).toFixed(1) + 'M' 
            },
            { 
              name: 'WHEAT', 
              price: (prices.wheat * PRICE_LOT_SIZE).toFixed(2), 
              change: (Math.random() * 2 - 1).toFixed(1) + '%', 
              trend: Math.random() > 0.6 ? 'up' : 'down', 
              volume: (Math.random() * 100 + 50).toFixed(0) + 'k' 
            },
          ];

          setMarketData(dynamicData);
        }
      } catch (err) {
        console.error("Market dynamic sync failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketDynamics();
    const interval = setInterval(fetchMarketDynamics, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Indexing Global Commodities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Global Exchange</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Real-time Commodity Index</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-accent-cyan" />
        </div>
      </div>

      <div className="grid gap-3">
        {marketData.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="tech-card flex items-center justify-between p-4 group hover:border-accent-cyan/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-10 rounded-full ${item.trend === 'up' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} />
              <div>
                <h3 className="font-black text-lg">{item.name}</h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Vol: {item.volume}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-mono font-bold">{item.price} <span className="text-[10px] text-zinc-500">TON</span></div>
              <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">/ 100K UNITS</div>
              <div className={`text-xs font-mono flex items-center justify-end gap-1 ${item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bento-card p-4 bg-accent-orange/5 border-accent-orange/20 text-center">
        <div className="flex items-center justify-center gap-2 text-accent-orange mb-2">
          <Zap className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pricing Protocol</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
          Prices are algorithmically generated based on aggregate Global Reserves. 
          High stockpiles decrease value; scarcity drives appreciation.
        </p>
      </div>
    </div>
  );
}
