import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet, injectScriptTagProxied } from './inject';
import { AD_SOCIALBAR_URL } from '@/constants';
import { useSettings } from '@/store';

export default function SocialBarLoader() {
  const loadedRef = useRef(false);
  const settings = useSettings();

  useEffect(() => {
    const ssKey = 'ads:socialbar:loaded';
    const maybeLoad = async () => {
      if (loadedRef.current) return;
      if (!settings.enableSocialBar) return;
      if (getAdConsent() !== 'granted') return;
      if (sessionStorage.getItem(ssKey) === '1') return;
      // Prefer script tag with src through Scramjet proxy
      let ok = await injectScriptTagProxied(AD_SOCIALBAR_URL);
      if (!ok) ok = await loadScriptViaScramjet(AD_SOCIALBAR_URL);
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
