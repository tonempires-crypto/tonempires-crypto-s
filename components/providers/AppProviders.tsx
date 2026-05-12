'use client';

import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AudioProvider } from './AudioProvider';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';

function RootLanguageHandler() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' || lang === 'he') ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initializing Telegram WebApp
    const initTelegram = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param; // Captured from ?startapp=...

        if (user) {
          // Telegram is ready, but we'll handle DB logic in the specific pages
          // to avoid multiple conflicting upsert calls.
        }
      }
    };

    initTelegram();
  }, []);

  return (
    <TonConnectUIProvider 
      manifestUrl="https://tonempires-crypto-s.vercel.app/tonconnect-manifest.json"
      uiPreferences={{ theme: THEME.DARK }}
    >
      <AudioProvider>
        <RootLanguageHandler />
        {children}
      </AudioProvider>
    </TonConnectUIProvider>
  );
}
