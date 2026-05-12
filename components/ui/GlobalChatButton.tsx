'use client';

import { useTranslation } from 'react-i18next';

export default function GlobalChatButton() {
  const { t } = useTranslation();

  return (
    <a 
      href="https://discord.gg/KH2mzsCAD" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap"
    >
      <div className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center gap-2 border border-white/20">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {t('common.chat_btn')}
      </div>
    </a>
  );
}
