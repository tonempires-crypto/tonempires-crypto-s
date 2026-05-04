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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-industrial-bg text-[#E0E0E0] h-screen overflow-hidden`}
      >
        <AppProviders>
          <main className="h-full w-full bg-industrial-bg relative flex flex-col max-w-md mx-auto overflow-y-auto">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
