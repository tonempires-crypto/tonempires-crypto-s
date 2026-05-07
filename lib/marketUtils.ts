import { supabase } from './supabaseClient';

export const MARKET_CONFIG = {
  OIL: { base: 2.5, scale: 50000 },
  GOLD: { base: 3, scale: 10000 },
  IRON: { base: 1.2, scale: 100000 },
  WHEAT: { base: 0.25, scale: 200000 },
};

export const PRICE_LOT_SIZE = 100000;

export function calculateResourcePrice(type: string, reserve: number) {
  const config = MARKET_CONFIG[type.toUpperCase() as keyof typeof MARKET_CONFIG];
  if (!config) return 0;
  
  // Logical price for 100,000 units
  const lotPrice = config.base / (1 + (reserve / config.scale));
  const finalLotPrice = Math.max(config.base * 0.1, lotPrice);
  
  // Return price per single unit
  return finalLotPrice / PRICE_LOT_SIZE;
}

export async function getGlobalMarketPrices() {
  const { data: regions } = await supabase.from('regions').select('*');
  if (!regions) return null;

  const totals = {
    oil: regions.reduce((acc, r) => acc + (r.oil_reserve || 0), 0),
    gold: regions.reduce((acc, r) => acc + (r.gold_reserve || 0), 0),
    iron: regions.reduce((acc, r) => acc + (r.iron_reserve || 0), 0),
    wheat: regions.reduce((acc, r) => acc + (r.wheat_reserve || 0), 0),
  };

  return {
    oil: calculateResourcePrice('OIL', totals.oil),
    gold: calculateResourcePrice('GOLD', totals.gold),
    iron: calculateResourcePrice('IRON', totals.iron),
    wheat: calculateResourcePrice('WHEAT', totals.wheat),
  };
}
