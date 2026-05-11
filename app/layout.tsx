import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AppProviders from "@/components/providers/AppProviders";
import IntroOverlay from "@/components/ui/IntroOverlay";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ton Empires",
  description: "Socio-Economic & Political Simulator for Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-industrial-bg text-[#E0E0E0] h-screen overflow-hidden`}
      >
        <AppProviders>
          <IntroOverlay />
          <main className="h-full w-full bg-industrial-bg relative flex flex-col max-w-md mx-auto overflow-y-auto">
            {children}
            
            {/* Global Chat Button */}
            <a 
              href="https://discord.gg/KH2mzsCAD" 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap"
            >
              <div className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center gap-2 border border-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Chatting with community
              </div>
            </a>
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
