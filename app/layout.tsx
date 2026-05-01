import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AppProviders from "@/components/providers/AppProviders";

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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-industrial-bg text-[#E0E0E0] overflow-hidden flex items-center justify-center min-h-screen`}
      >
        <AppProviders>
          <main className="w-[375px] h-[720px] bg-industrial-card border border-border-main rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto industrial-grid">
              {children}
            </div>
            
            {/* Navigation Bar matching theme */}
            <nav className="h-20 bg-industrial-card border-t border-border-main flex items-center justify-around px-4 shrink-0">
              <div className="flex flex-col items-center gap-1 nav-item-active">
                <div className="w-5 h-5 bg-accent-cyan rounded-sm shadow-[0_0_10px_rgba(0,255,209,0.4)]"></div>
                <span className="text-[9px] font-bold">DASH</span>
              </div>
              <div className="flex flex-col items-center gap-1 nav-item-inactive">
                <div className="w-5 h-5 border border-white rounded-sm"></div>
                <span className="text-[9px]">MARKET</span>
              </div>
              <div className="flex flex-col items-center gap-1 nav-item-inactive">
                <div className="w-5 h-5 border border-white rounded-sm"></div>
                <span className="text-[9px]">TRADE</span>
              </div>
              <div className="flex flex-col items-center gap-1 nav-item-inactive">
                <div className="w-5 h-5 border border-white rounded-sm"></div>
                <span className="text-[9px]">TASKS</span>
              </div>
              <div className="flex flex-col items-center gap-1 nav-item-inactive">
                <div className="w-5 h-5 border border-white rounded-sm"></div>
                <span className="text-[9px]">INVITE</span>
              </div>
            </nav>
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
