'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function InstallButton() {
  const [prompt, setPrompt] = useState<DeferredPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as DeferredPrompt);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const mq = window.matchMedia('(display-mode: standalone)');
    setInstalled(mq.matches || ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (installed) return <span className="installed-label"><Download size={14}/> Installed</span>;
  if (!prompt) return null;
  return <button className="btn btn-secondary" onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }}><Download size={15}/> Install NatureLens</button>;
}
