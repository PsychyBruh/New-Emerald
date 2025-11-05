import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet } from './inject';
import { AD_POPUNDER_URL } from '@/constants';
import { useSettings } from '@/store';

export default function PopunderLoader() {
  const loadedRef = useRef(false);
  const settings = useSettings();

  useEffect(() => {
    const maybeLoad = async () => {
      if (loadedRef.current) return;
      if (!settings.enablePopunder) return;
      if (getAdConsent() !== 'granted') return;
      const ssKey = 'ads:popunder:loaded';
      if (sessionStorage.getItem(ssKey) === '1') return;
      const ok = await loadScriptViaScramjet(AD_POPUNDER_URL);
      if (ok) {
        loadedRef.current = true;
        sessionStorage.setItem(ssKey, '1');
        try { await sendBeaconOnce(`/api/ads/ping?tag=popunder`); } catch {}
      }
    };
    maybeLoad();
    const onChanged = () => maybeLoad();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [settings.enablePopunder]);

  return null;
}

