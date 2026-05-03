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
          // Zero-Click Registration / Auto-Save Logic using upsert
          const referralInfo = startParam ? parseInt(startParam) : null;
          
          await supabase.from('users').upsert({
            telegram_id: user.id,
            username: user.username || `User_${user.id}`,
            ton_balance: 0,
            referred_by: referralInfo,
            last_login: new Date().toISOString(),
          }, { 
            onConflict: 'telegram_id',
            ignoreDuplicates: false 
          });
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
