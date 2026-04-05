import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopBar } from '@/components/TopBar';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Ludo Online',
  description: 'Multiplayer Ludo — play with friends',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ludo Online',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TopBar />
        <main className="pt-14">{children}</main>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
