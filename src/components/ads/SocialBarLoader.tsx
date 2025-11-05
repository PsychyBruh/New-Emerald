import { useEffect, useRef } from 'react';
import { getAdConsent, sendBeaconOnce } from './consent';
import { loadScriptViaScramjet, injectScriptTagProxied } from './inject';
import { AD_SOCIALBAR_URL } from '@/constants';
import { useSettings } from '@/store';

export default function SocialBarLoader() {
  const loadedRef = useRef(false);
  const settings = useSettings();

  const ensureTopRight = () => {
    try {
      const sel = 'iframe[src*="effectivegatecpm.com"],iframe[src*="highperformanceformat.com"]';
      const nodes = Array.from(document.querySelectorAll(sel)) as (HTMLIFrameElement)[];
      nodes.forEach((el) => {
        el.style.position = 'fixed';
        el.style.top = '12px';
        el.style.right = '12px';
        el.style.bottom = 'auto';
        el.style.left = 'auto';
        el.style.maxWidth = '100vw';
        el.style.maxHeight = '40vh';
        el.style.zIndex = '2147483647';
      });
    } catch {}
  };

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
        // Try to reposition to top-right and keep watching for changes briefly
        ensureTopRight();
        const t0 = Date.now();
        const id = window.setInterval(() => {
          ensureTopRight();
          if (Date.now() - t0 > 10000) window.clearInterval(id);
        }, 800);
        const mo = new MutationObserver(() => ensureTopRight());
        try { mo.observe(document.body, { childList: true, subtree: true }); } catch {}
        window.setTimeout(() => mo.disconnect(), 10000);
      }
    };
    maybeLoad();
    const onChanged = () => maybeLoad();
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    return () => window.removeEventListener('supportAds:changed', onChanged as EventListener);
  }, [settings.enableSocialBar]);

  return null;
}
