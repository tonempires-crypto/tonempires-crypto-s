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
    // RELAXED QUERY: We look for companies in the region. We'll filter for gov status in JS to avoid empty results if DB flags are inconsistent.
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .eq('region', regionId);

    if (compErr || !companies || companies.length === 0) {
      console.warn(`No companies found for region ${regionId}. Check DB 'region' column.`);
      return; 
    }

    // 4. Calculate Production
    // If the region still uses 'reserve' naming, we fallback, but we prefer 'treasury'
    const treasuryUpdates: Record<string, number> = {
      oil_treasury: region.oil_treasury || region.oil_reserve || 0,
      gold_treasury: region.gold_treasury || region.gold_reserve || 0,
      iron_treasury: region.iron_treasury || region.iron_reserve || 0,
      wheat_treasury: region.wheat_treasury || region.wheat_reserve || 0
    };

    let hasProduction = false;
    const govCompanies = companies.filter(c => c.is_government);

    if (govCompanies.length === 0) {
      console.warn("No government companies detected in active region.");
      return;
    }

    govCompanies.forEach(company => {
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
      console.log(`PRODUCTION PULSE: Injecting assets into ${regionId}. Hours: ${elapsedHours.toFixed(4)}`);
      const { error: updateErr } = await supabase
        .from('regions')
        .update({
          ...treasuryUpdates,
          production_sync: now.toISOString(),
          updated_at: now.toISOString() 
        })
        .eq('id', regionId);
      
      if (updateErr) console.error("Treasury Write Denied:", updateErr);
    } 
    // CRITICAL: Removed the 'else' block that was resetting the clock to zero!

  } catch (err) {
    console.error("PRODUCTION PULSE FATAL FAILURE:", err);
  }
}
