'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, MapPin, ChevronRight, Loader2, Target } from 'lucide-react';
import WorldSVGMap from './WorldSVGMap';

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
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

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
        <h1 className="text-3xl font-black tracking-tighter text-white">SELECT YOUR <span className="text-accent-cyan">EMPIRE</span></h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Your starting region determines your initial resource bonuses. Choose your sector to begin.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <WorldSVGMap 
          selectedRegion={selectedId} 
          onRegionSelect={(id) => setSelectedId(id)}
          className="border-accent-cyan/20"
        />
      </motion.div>

      <div className="space-y-3 pb-20">
        {REGIONS.map((region, i) => (
          <motion.button
            key={region.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
            onClick={() => onSelect(region.id)}
            onMouseEnter={() => setSelectedId(region.id)}
            className={`w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden group flex items-center justify-between
              ${selectedId === region.id ? `${region.accent} ${region.color} ring-1 ring-white/10` : 'border-white/5 bg-zinc-900/40 opacity-70 hover:opacity-100'}
            `}
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

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest text-center">
          Authorization required from the Council of Five • Permanent Sector Assignation
        </div>
      </div>
    </div>
  );
}
