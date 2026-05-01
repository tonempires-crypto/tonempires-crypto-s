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
        if (user) {
          // Zero-Click Registration / Auto-Save Logic
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', user.id)
            .single();

          if (!data && !error) {
            // User doesn't exist, create row
            await supabase.from('users').insert({
              telegram_id: user.id,
              username: user.username || `User_${user.id}`,
              ton_balance: 0,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
            });
          } else if (data) {
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('telegram_id', user.id);
          }
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
