'use client';

import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState('');

  useEffect(() => {
    // Priority: 1. Environment Variable (Secret) 2. Dynamic Local Manifest
    const envManifest = process.env.NEXT_PUBLIC_MANIFEST_URL;
    if (envManifest) {
      setManifestUrl(envManifest);
    } else {
      setManifestUrl(`${window.location.origin}/api/tonconnect/manifest`);
    }
    
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
      manifestUrl={manifestUrl || "/api/tonconnect/manifest"}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
