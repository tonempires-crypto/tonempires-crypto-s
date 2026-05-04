'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, BarChart3, Zap, ShoppingCart } from 'lucide-react';

const MARKET_DATA = [
  { name: 'OIL', price: 1.42, change: '+12.4%', trend: 'up', volume: '1.2M' },
  { name: 'GOLD', price: 852.10, change: '-2.1%', trend: 'down', volume: '45k' },
  { name: 'IRON', price: 0.88, change: '+0.5%', trend: 'up', volume: '8.9M' },
  { name: 'WHEAT', price: 0.12, change: '+5.2%', trend: 'up', volume: '150k' },
];

export default function MarketSection() {
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
        {MARKET_DATA.map((item, i) => (
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
              <div className={`text-xs font-mono flex items-center justify-end gap-1 ${item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bento-card p-4 bg-accent-orange/5 border-accent-orange/20">
        <div className="flex items-center gap-2 text-accent-orange mb-2">
          <Zap className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Market Alert</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The Council has announced a 15% tariff increase on Iron exports from the Middle East region. Prices expected to surge.
        </p>
      </div>
    </div>
  );
}
