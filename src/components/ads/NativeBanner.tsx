import { useEffect, useRef, useState } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet } from './inject';
import { useSettings } from '@/store';
import { cn } from '@/lib/utils';

type Props = {
  invokeUrl: string;
  containerId: string;
  className?: string;
};

export default function NativeBanner({ invokeUrl, containerId, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const inject = async () => {
      if (!ready) return;
      if (getAdConsent() !== 'granted') return;
      if (!settings.enableNativeBanner) return;
      const el = ref.current;
      if (!el) return;
      const slot = el.querySelector(`#${containerId}`) as HTMLElement | null;
      if (!slot) return;
      // clean previous content to avoid stacking
      slot.innerHTML = '';
      try { await sendBeaconOnce(`/api/ads/ping?tag=native`); } catch {}
      await loadScriptViaScramjet(invokeUrl);
    };
    inject();
    // re-inject when toggles/consent change
    const onChanged = () => inject();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [ready, settings.enableNativeBanner, invokeUrl, containerId]);

  return (
    <div ref={ref} data-ad-slot className={cn('relative overflow-hidden', className)}>
      <div className="absolute top-1 left-1 z-10 text-[10px] uppercase bg-card/80 border border-border/40 px-1.5 py-0.5 rounded-md">
        Sponsored
      </div>
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}

