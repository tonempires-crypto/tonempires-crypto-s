'use client';

import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

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
      setIsLoaded(true);
    };

    initTelegram();
  }, []);

  return (
    <TonConnectUIProvider 
      manifestUrl="/tonconnect-manifest.json"
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
