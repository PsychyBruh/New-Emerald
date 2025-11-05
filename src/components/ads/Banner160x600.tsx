import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { cn } from '@/lib/utils';
import { SCRAMJET_PREFIX } from '@/constants';
import { useSettings } from '@/store';

const BANNER_KEY = '468655d37c196632418bba76dd7b8a91';
const INVOKE_URL = `https://www.highperformanceformat.com/${BANNER_KEY}/invoke.js`;

async function fetchViaScramjet(url: string): Promise<string | null> {
  try {
    const base = SCRAMJET_PREFIX.endsWith('/') ? SCRAMJET_PREFIX : `${SCRAMJET_PREFIX}/`;
    const proxied = `${base}${encodeURIComponent(url)}`;
    const res = await fetch(proxied, { credentials: 'omit' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default function Banner160x600({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const settings = useSettings();

  useEffect(() => {
    const mount = async () => {
      if (getAdConsent() !== 'granted') return;
      if (!settings.enableNativeBanner) return;
      const host = ref.current;
      if (!host) return;

      host.innerHTML = '';

      // Label
      const label = document.createElement('div');
      label.className = 'absolute top-1 left-1 z-10 text-[10px] uppercase bg-card/80 border border-border/40 px-1.5 py-0.5 rounded-md';
      label.textContent = 'Sponsored';
      host.appendChild(label);

      // Container box
      const box = document.createElement('div');
      box.style.width = '160px';
      box.style.height = '600px';
      box.style.position = 'relative';
      box.style.overflow = 'hidden';
      host.appendChild(box);

      // Prepare atOptions inline script
      const s1 = document.createElement('script');
      s1.type = 'text/javascript';
      s1.text = `var atOptions = { key: '${BANNER_KEY}', format: 'iframe', height: 600, width: 160, params: {} }; window.atOptions = atOptions;`;
      box.appendChild(s1);

      // Fetch and inject invoke.js via Scramjet
      const code = await fetchViaScramjet(INVOKE_URL);
      if (!code) return;
      const s2 = document.createElement('script');
      s2.type = 'text/javascript';
      s2.text = code;
      box.appendChild(s2);

      try { await sendBeaconOnce('/api/ads/ping?tag=banner160x600'); } catch {}
    };

    mount();

    const onChanged = () => mount();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [settings.enableNativeBanner]);

  return <div ref={ref} data-ad-slot className={cn('relative overflow-hidden', className)} />;
}

