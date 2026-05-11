'use client';

import { motion } from 'motion/react';

interface WorldSVGMapProps {
  selectedRegion?: string;
  onRegionSelect?: (regionId: string) => void;
  className?: string;
}

const REGION_DATA = [
  { 
    id: 'europe', 
    name: 'Europe',
    path: "M140,40 L210,35 L220,85 L180,95 L140,85 Z",
    accent: "stroke-blue-500",
    fill: "fill-blue-500/20"
  },
  {
    id: 'africa',
    name: 'Africa',
    path: "M145,105 L215,95 L240,125 L210,195 L170,185 L140,135 Z",
    accent: "stroke-emerald-500",
    fill: "fill-emerald-500/20"
  },
  {
    id: 'middle_east',
    name: 'Middle East',
    path: "M225,90 L265,90 L280,125 L245,135 L225,115 Z",
    accent: "stroke-orange-500",
    fill: "fill-orange-500/20"
  },
  {
    id: 'asia',
    name: 'Asia',
    path: "M220,40 L330,35 L360,85 L285,120 L270,95 Z",
    accent: "stroke-red-500",
    fill: "fill-red-500/20"
  },
  {
    id: 'east_asia',
    name: 'East Asia',
    path: "M340,45 L400,45 L415,100 L370,125 L335,105 Z",
    accent: "stroke-purple-500",
    fill: "fill-purple-500/20"
  }
];

// Contextual decor paths (Americas, Oceania - non-selectable)
const DECOR_PATHS = [
  "M20,50 L80,45 L100,100 L70,140 L30,130 Z", // North America
  "M60,150 L90,150 L100,210 L70,220 Z", // South America
  "M350,150 L400,150 L420,190 L370,200 Z" // Oceania
];

export default function WorldSVGMap({ selectedRegion, onRegionSelect, className = "" }: WorldSVGMapProps) {
  return (
    <div className={`relative aspect-[2/1] w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden group ${className}`}>
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>

      <svg 
        viewBox="0 0 440 220" 
        className="w-full h-full p-4"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Decor Continents */}
        {DECOR_PATHS.map((path, i) => (
          <path 
            key={`decor-${i}`}
            d={path}
            className="fill-zinc-900/40 stroke-zinc-800/40 stroke-[0.5]"
          />
        ))}

        {/* Actionable Regions */}
        {REGION_DATA.map((region) => {
          const isSelected = selectedRegion === region.id;
          
          return (
            <motion.path
              key={region.id}
              d={region.path}
              initial={false}
              animate={{ 
                fillOpacity: isSelected ? 0.8 : 0.3,
                strokeOpacity: isSelected ? 1 : 0.4,
                scale: isSelected ? 1.02 : 1
              }}
              whileHover={{ 
                fillOpacity: 0.6,
                strokeOpacity: 0.8,
                scale: 1.01
              }}
              className={`
                cursor-pointer transition-all duration-300
                ${region.fill} ${region.accent}
                ${isSelected ? 'stroke-[2px]' : 'stroke-[1px]'}
              `}
              onClick={() => onRegionSelect?.(region.id)}
            >
              <title>{region.name}</title>
            </motion.path>
          );
        })}
      </svg>

      {/* Region Labels */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
        {REGION_DATA.map((r) => (
          <div 
            key={r.id} 
            className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-opacity
              ${selectedRegion === r.id ? 'bg-white/10 border-white/20 text-white' : 'opacity-30 border-transparent text-zinc-500'}
            `}
          >
            {r.name.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
