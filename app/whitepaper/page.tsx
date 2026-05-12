'use client';

import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Zap, 
  Coins, 
  Target, 
  Users, 
  LineChart, 
  ShieldCheck, 
  Ghost,
  Globe,
  Cpu,
  Lock,
  Shapes,
  Sword
} from 'lucide-react';
import Link from 'next/link';

import { useTranslation } from 'react-i18next';

export default function WhitePaperPage() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t('whitepaper.intro.title'),
      icon: Target,
      color: "text-accent-cyan",
      content: t('whitepaper.intro.content')
    },
    {
      title: t('whitepaper.pillars.title'),
      icon: Cpu,
      color: "text-purple-400",
      content: t('whitepaper.pillars.content')
    },
    {
      title: t('whitepaper.sovereignty.title'),
      icon: Globe,
      color: "text-blue-400",
      content: t('whitepaper.sovereignty.content')
    },
    {
      title: t('whitepaper.command.title'),
      icon: Sword,
      color: "text-red-500",
      content: t('whitepaper.command.content')
    },
    {
      title: t('whitepaper.how_to_play.title'),
      icon: Shapes,
      color: "text-emerald-400",
      content: t('whitepaper.how_to_play.content')
    },
    {
      title: t('whitepaper.pop.title'),
      icon: Zap,
      color: "text-accent-orange",
      content: t('whitepaper.pop.content')
    },
    {
      title: t('whitepaper.tokenomics.title'),
      icon: Coins,
      color: "text-yellow-500",
      content: t('whitepaper.tokenomics.content')
    },
    {
      title: t('whitepaper.governance.title'),
      icon: ShieldCheck,
      color: "text-indigo-400",
      content: t('whitepaper.governance.content')
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-accent-cyan selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-cyan/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
          <Link href="/" className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="text-right">
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">{t('whitepaper.title')}</h1>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">{t('whitepaper.subtitle')}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-8 text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -10, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-20 h-20 mx-auto bg-accent-cyan/10 rounded-3xl border border-accent-cyan/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(45,212,191,0.15)]"
          >
            <BookOpen className="w-10 h-10 text-accent-cyan" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-cyan rounded-full animate-ping opacity-50" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black italic uppercase tracking-tighter"
          >
            {t('whitepaper.hero_title')}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed tracking-wider max-w-[280px] mx-auto"
          >
            {t('whitepaper.hero_desc')}
          </motion.p>
        </div>

        {/* TEP Supply Card */}
        <div className="px-6 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="tech-card p-6 border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/5 to-transparent relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Cpu className="w-20 h-20 text-accent-cyan" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-[9px] font-mono text-accent-cyan uppercase tracking-widest mb-2">{t('whitepaper.fixed')}</span>
              <div className="text-4xl font-black italic text-white flex items-center gap-3">
                1,000,000
                <span className="text-lg text-accent-cyan opacity-80">TEP</span>
              </div>
              <div className="w-full h-[1px] bg-white/10 my-4" />
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase mb-1">Decimals</span>
                  <span className="text-xs font-bold">9</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/5">
                  <span className="text-[8px] text-zinc-500 uppercase mb-1">Standard</span>
                  <span className="text-xs font-bold">JETTON</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase mb-1">Network</span>
                  <span className="text-xs font-bold uppercase">TON</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Sections */}
        <div className="px-6 space-y-6 pb-32">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(24, 24, 27, 0.8)" }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="tech-card p-6 group hover:border-accent-cyan/20 transition-all cursor-default"
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.div 
                  whileHover={{ rotate: 15 }}
                  className={`p-3 bg-zinc-900 rounded-xl border border-white/5 ${section.color}`}
                >
                  <section.icon className="w-5 h-5" />
                </motion.div>
                <h3 className="text-sm font-black uppercase tracking-widest">{section.title}</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                {section.content}
              </p>
              
              <div className="mt-4 flex items-center gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-1 bg-accent-cyan rounded-full" 
                />
                <div className="h-[1px] flex-1 bg-zinc-800 group-hover:bg-accent-cyan/20 transition-colors" />
              </div>
            </motion.div>
          ))}

          {/* Footer Card */}
          <div className="p-8 border border-dashed border-zinc-800 rounded-3xl text-center space-y-4">
            <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Protocol Integrity Guaranteed</h4>
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed uppercase">
              The Empire is built on immutable logic. Participation is mandatory for success. 
              TEP distribution is handled via verified smart contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
