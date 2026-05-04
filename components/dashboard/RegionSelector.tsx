'use client';

import { useState } from 'react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

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
          Your starting region determines your initial resource bonuses. Once confirmed, your sector is locked in via the Imperial Registry.
        </p>
      </motion.div>

      <div className="space-y-3 flex-1">
        {REGIONS.map((region, i) => (
          <motion.button
            key={region.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedId(region.id)}
            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group
              ${selectedId === region.id 
                ? 'border-accent-cyan bg-accent-cyan/10 ring-1 ring-accent-cyan/50' 
                : `${region.accent} ${region.color} hover:brightness-110`}`}
          >
            <div className="flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all
                ${selectedId === region.id ? 'bg-accent-cyan border-white/20' : 'bg-black/40 border-white/5'}`}>
                <MapPin className={`w-5 h-5 ${selectedId === region.id ? 'text-black' : 'text-white/60'}`} />
              </div>
              <div>
                <h3 className={`font-bold transition-colors ${selectedId === region.id ? 'text-accent-cyan' : 'text-white'}`}>{region.name}</h3>
                <p className="text-[10px] text-zinc-400 font-mono leading-tight">{region.description}</p>
              </div>
            </div>
            {selectedId === region.id && (
              <motion.div layoutId="check" className="w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-black" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      
      <div className="mt-8 space-y-4">
        <button
          onClick={handleConfirm}
          disabled={!selectedId}
          className={`w-full py-5 rounded-2xl font-black tracking-[0.2em] uppercase transition-all shadow-xl active:scale-[0.98]
            ${selectedId 
              ? 'bg-accent-cyan text-black hover:brightness-110 shadow-accent-cyan/20' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed grayscale'}`}
        >
          {selectedId ? `Establish Empire in ${REGIONS.find(r => r.id === selectedId)?.name}` : 'Select a Region'}
        </button>

        <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest text-center">
          Authorization required from the Council of Five • Permanent Sector Assignation
        </div>
      </div>
    </div>
  );
}
