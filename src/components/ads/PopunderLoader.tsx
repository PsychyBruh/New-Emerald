import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet, injectScriptTagProxied } from './inject';
import { AD_POPUNDER_URL } from '@/constants';
import { useSettings } from '@/store';

export default function PopunderLoader() {
  const loadedRef = useRef(false);
  const settings = useSettings();

  useEffect(() => {
    const ssKey = 'ads:popunder:loaded';
    const tryLoad = async () => {
      if (loadedRef.current) return false;
      if (!settings.enablePopunder) return false;
      if (getAdConsent() !== 'granted') return false;
      if (sessionStorage.getItem(ssKey) === '1') return false;
      // Prefer real script tag with src to preserve document.currentScript semantics
      let ok = await injectScriptTagProxied(AD_POPUNDER_URL);
      if (!ok) ok = await loadScriptViaScramjet(AD_POPUNDER_URL);
      if (ok) {
        loadedRef.current = true;
        sessionStorage.setItem(ssKey, '1');
        try { await sendBeaconOnce(`/api/ads/ping?tag=popunder`); } catch {}
      }
      return ok;
    };

    const immediate = async () => {
      // Many popunders require a user gesture; if not already loaded, bind first pointerdown
      const ok = await tryLoad();
      if (!ok) {
        const onFirst = async () => {
          window.removeEventListener('pointerdown', onFirst);
          await tryLoad();
        };
        window.addEventListener('pointerdown', onFirst, { once: true });
      }
    };

    immediate();
    const onChanged = () => immediate();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [settings.enablePopunder]);

  return null;
}
