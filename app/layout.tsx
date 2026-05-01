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
          <main className="min-h-screen w-full bg-industrial-bg relative flex flex-col overflow-hidden max-w-md mx-auto">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
