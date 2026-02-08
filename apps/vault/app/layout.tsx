import { ClerkProvider } from '@clerk/nextjs';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata = {
  title: '⟁ KRYV_VAULT',
  description: 'Neural Economy Terminal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="bg-black font-sans antialiased text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
