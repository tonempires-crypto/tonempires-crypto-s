'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Globe, Volume2, VolumeX, ChevronRight, Volume1, BookOpen, MessageSquare, Languages } from 'lucide-react';
import { useAudio } from '@/components/providers/AudioProvider';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'ru', name: 'Русский' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'th', name: 'ไทย' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'he', name: 'עברית' },
];

export default function SettingsMenu() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const { isMuted, setIsMuted, volume, setVolume } = useAudio();

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-zinc-400 hover:text-white shadow-xl"
        id="settings-gear-button"
      >
        <Settings className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-90 text-accent-cyan' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsOpen(false); setShowLanguage(false); }}
              className="fixed inset-0 z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-5 z-50 overflow-hidden"
              id="settings-dropdown"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {showLanguage ? (
                    <button 
                      onClick={() => setShowLanguage(false)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('settings.language')}</span>
                    </button>
                  ) : (
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('settings.title')}</h3>
                  )}
                  <div className="w-1 h-3 bg-accent-cyan/30 rounded-full" />
                </div>

                {!showLanguage ? (
                  <div className="space-y-3">
                    {/* Language Selector Trigger */}
                    <button 
                      onClick={() => setShowLanguage(true)}
                      className="w-full p-3 bg-zinc-800/50 border border-white/5 rounded-xl flex items-center justify-between group hover:border-accent-cyan/30 transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-lg text-accent-cyan group-hover:bg-accent-cyan/10 transition-colors">
                          <Languages className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-accent-cyan/70 transition-colors">{t('settings.language').toUpperCase()}</span>
                          <span className="text-[12px] font-black text-white">{LANGUAGES.find(l => l.code === i18n.language)?.name || 'English'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-accent-cyan" />
                    </button>

                    {/* Audio Controls */}
                    <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-900 rounded-lg">
                            {isMuted ? (
                              <VolumeX className="w-4 h-4 text-red-500" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-accent-cyan" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('settings.music')}</span>
                        </div>
                        <button
                          onClick={toggleMute}
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                            isMuted ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                          }`}
                        >
                          {isMuted ? 'OFF' : 'ON'}
                        </button>
                      </div>

                      {!isMuted && (
                        <div className="flex items-center gap-3 pt-2">
                          <Volume1 className="w-3 h-3 text-zinc-600" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-accent-cyan h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <Volume2 className="w-3 h-3 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    {/* White Paper Link */}
                    <Link 
                      href="/whitepaper"
                      onClick={() => setIsOpen(false)}
                      className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl flex items-center justify-between group hover:border-accent-cyan/30 transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-lg text-accent-cyan group-hover:bg-accent-cyan/10 transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left text-zinc-300">
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-accent-cyan/70 transition-colors">PROTOCOL INTEL</span>
                          <span className="text-[12px] font-black">{t('settings.whitepaper').toUpperCase()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-accent-cyan" />
                    </Link>

                    {/* Suggestion/Report */}
                    <a
                      href="mailto:tonempires@gmail.com"
                      className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl flex items-center justify-between group hover:border-accent-cyan/30 transition-all active:scale-95 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-lg text-accent-cyan group-hover:bg-accent-cyan/10 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left text-zinc-300">
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-accent-cyan/70 transition-colors">SUPPORT</span>
                          <span className="text-[12px] font-black">{t('settings.report').toUpperCase()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-accent-cyan" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLanguage(false);
                        }}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all active:scale-95
                          ${i18n.language === lang.code 
                            ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan' 
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">{lang.name}</span>
                        {i18n.language === lang.code && <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)]" />}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-2 text-center">
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{t('settings.version')}</span>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-accent-cyan/5 rounded-full blur-xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
