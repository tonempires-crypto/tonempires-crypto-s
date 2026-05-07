import { supabase } from './supabaseClient';

export async function processProductionPulse(regionId: string) {
  try {
    // 1. Fetch Region Data (to get last sync time)
    const { data: region, error: regionErr } = await supabase
      .from('regions')
      .select('*')
      .eq('id', regionId)
      .single();

    if (regionErr || !region) return;

    // 2. Calculate time elapsed
    const now = new Date();
    const lastUpdate = new Date(region.production_sync || region.updated_at || now);
    const elapsedMs = now.getTime() - lastUpdate.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    // Only process if at least 1 minute has passed to save on DB writes
    if (elapsedHours < 0.01) return;

    // 3. Fetch Government Companies in this region
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .eq('region', regionId)
      .eq('is_government', true);

    if (compErr || !companies) return;

    // 4. Calculate Production
    const treasuryUpdates: Record<string, number> = {
      oil_treasury: region.oil_treasury || 0,
      gold_treasury: region.gold_treasury || 0,
      iron_treasury: region.iron_treasury || 0,
      wheat_treasury: region.wheat_treasury || 0
    };

    let hasProduction = false;

    companies.forEach(company => {
      const base = 50; 
      const employeeMultiplier = 1 + ((company.employees_count || 0) * 0.1);
      const levelMultiplier = 1 + ((company.level || 1) * 0.2);
      
      let regionalBonus = 1;
      if (company.region === 'middle_east' && company.resource_type === 'oil') regionalBonus = 1.5;
      if (company.region === 'africa' && company.resource_type === 'gold') regionalBonus = 1.6;
      if (company.region === 'europe' && company.resource_type === 'iron') regionalBonus = 1.3;
      if (company.region === 'asia' && company.resource_type === 'wheat') regionalBonus = 1.5;
      if (company.region === 'east_asia') regionalBonus = 1.15;

      const hourlyRate = base * employeeMultiplier * levelMultiplier * regionalBonus;
      const produced = hourlyRate * elapsedHours;

      if (produced > 0) {
        const column = `${company.resource_type}_treasury`;
        if (treasuryUpdates[column] !== undefined) {
          treasuryUpdates[column] += produced;
          hasProduction = true;
        }
      }
    });

    if (hasProduction) {
      console.log(`PRODUCTION PULSE: Adding resources to ${regionId} treasury. Elapsed: ${elapsedHours.toFixed(4)}h`);
      await supabase
        .from('regions')
        .update({
          ...treasuryUpdates,
          production_sync: now.toISOString(),
          updated_at: now.toISOString() 
        })
        .eq('id', regionId);
    } else {
      // Even if no production (e.g. 0 employees), update the pulse to avoid continuous checks
      await supabase
        .from('regions')
        .update({ production_sync: now.toISOString() })
        .eq('id', regionId);
    }

  } catch (err) {
    console.error("PRODUCTION PULSE FATAL FAILURE:", err);
  }
}
