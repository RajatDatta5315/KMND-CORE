import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: '⟁ KMND Wallet',
  description: 'KryvMind Currency — Universal wallet for the KRYV ecosystem',
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head><link rel="icon" href="/logo.png" type="image/png"/></head>
      <body className="bg-black font-sans antialiased text-white">{children}</body>
    </html>
  );
}
