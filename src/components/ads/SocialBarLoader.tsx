import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet } from './inject';
import { AD_SOCIALBAR_URL } from '@/constants';
import { useSettings } from '@/store';

export default function SocialBarLoader() {
  const loadedRef = useRef(false);
  const settings = useSettings();

  useEffect(() => {
    const maybeLoad = async () => {
      if (loadedRef.current) return;
      if (!settings.enableSocialBar) return;
      if (getAdConsent() !== 'granted') return;
      const ssKey = 'ads:socialbar:loaded';
      if (sessionStorage.getItem(ssKey) === '1') return;
      const ok = await loadScriptViaScramjet(AD_SOCIALBAR_URL);
      if (ok) {
        loadedRef.current = true;
        sessionStorage.setItem(ssKey, '1');
        try { await sendBeaconOnce(`/api/ads/ping?tag=socialbar`); } catch {}
      }
    };
    maybeLoad();
    const onChanged = () => maybeLoad();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [settings.enableSocialBar]);

  return null;
}

