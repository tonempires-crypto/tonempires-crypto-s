'use client';

import { motion } from 'motion/react';
import { Globe, MapPin, ChevronRight } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  description: string;
  color: string;
  accent: string;
}

const REGIONS: Region[] = [
  { id: 'middle_east', name: 'Middle East', description: 'Oil-rich hub of ancient trade routes.', color: 'bg-orange-500/10', accent: 'border-orange-500/40' },
  { id: 'africa', name: 'Africa', description: 'Emerging frontier of resources and iron.', color: 'bg-emerald-500/10', accent: 'border-emerald-500/40' },
  { id: 'europe', name: 'Europe', description: 'Technical powerhouse with stable wheat markets.', color: 'bg-blue-500/10', accent: 'border-blue-500/40' },
  { id: 'asia', name: 'Asia', description: 'The sprawling gold standard of industry.', color: 'bg-red-500/10', accent: 'border-red-500/40' },
  { id: 'east_asia', name: 'East Asia', description: 'High-tech district with soaring valuations.', color: 'bg-purple-500/10', accent: 'border-purple-500/40' },
];

export default function RegionSelector({ onSelect }: { onSelect: (regionId: string) => void }) {
  return (
    <div className="absolute inset-0 z-[100] bg-industrial-bg flex flex-col p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <div className="flex items-center gap-2 text-accent-cyan mb-2">
          <Globe className="w-5 h-5" />
          <span className="text-xs font-mono tracking-[0.3em] font-bold">INITIATING ONBOARDING</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter">SELECT YOUR <span className="text-accent-cyan">EMPIRE</span></h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Your starting region determines your initial resource bonuses and political alliances. Choose wisely, Citizen.
        </p>
      </motion.div>

      <div className="space-y-3">
        {REGIONS.map((region, i) => (
          <motion.button
            key={region.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(region.id)}
            className={`w-full p-4 rounded-2xl border ${region.accent} ${region.color} flex items-center justify-between group hover:brightness-125 transition-all text-left`}
          >
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5">
                <MapPin className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-accent-cyan transition-colors">{region.name}</h3>
                <p className="text-[10px] text-zinc-400 font-mono leading-tight">{region.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all" />
          </motion.button>
        ))}
      </div>
      
      <div className="mt-8 pt-8 border-t border-white/5">
        <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest text-center">
          Authorization required from the Council of Five
        </div>
      </div>
    </div>
  );
}
