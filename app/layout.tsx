import type { Metadata } from 'next';
import { AppShell } from '@/components/AppShell';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'NatureLens — Offline AI Field Guide',
  description: 'Discover the natural world with local open-weight AI.',
  applicationName: 'NatureLens',
  manifest: '/manifest.webmanifest',
  themeColor: '#1f4a2e',
  icons: { icon: '/icon.svg' },
  appleWebApp: { capable: true, title: 'NatureLens', statusBarStyle: 'default' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const shouldRegisterSW = process.env.NODE_ENV === 'production';
  return <html lang="en"><body><AppShell>{children}</AppShell>{shouldRegisterSW && <script dangerouslySetInnerHTML={{__html:`if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));`}} />}</body></html>;
}
