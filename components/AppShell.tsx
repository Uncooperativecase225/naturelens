'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Camera, Compass, LayoutDashboard, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';

const nav = [
  { href:'/explore', label:'Explore', icon:Compass },
  { href:'/discoveries', label:'Discoveries', icon:Leaf },
  { href:'/journal', label:'Field journal', icon:BookOpen },
  { href:'/dashboard', label:'Dashboard', icon:LayoutDashboard }
];

function OnlineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  return <span className={`status-pill ${online ? 'online' : 'offline'}`}><span className="status-dot" />{online ? 'Online' : 'Offline'}</span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="shell">
      <div className="mobile-top">
        <Link href="/" className="mobile-brand">
          <div className="brand-mark compact"><Leaf size={18}/></div>
          <div><div className="brand-title">NatureLens</div><div className="brand-sub">offline field guide</div></div>
        </Link>
        <div className="mobile-actions"><OnlineBadge /><Link href="/explore" className="icon-btn"><Camera size={16}/></Link></div>
      </div>
      <div className="app-grid">
        <aside className="sidebar">
          <Link href="/" className="brand">
            <div className="brand-mark"><Leaf size={20}/></div>
            <div><div className="brand-title">NatureLens</div><div className="brand-sub">offline field guide</div></div>
          </Link>
          <div className="sidebar-status"><OnlineBadge /></div>
          <nav className="nav">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return <Link key={item.href} className={active ? 'active' : ''} href={item.href}><Icon size={17}/>{item.label}</Link>;
            })}
          </nav>
          <div className="sidebar-note"><strong>Touch Grass rule</strong><br/>The camera should point outward. The screen should only take your attention for the few seconds it takes to observe.</div>
        </aside>
        <main className="main">{children}</main>
      </div>
      <nav className="mobile-nav">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return <Link key={item.href} className={active ? 'active' : ''} href={item.href}><Icon size={17}/><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
