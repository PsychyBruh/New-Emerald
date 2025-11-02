export type AdConsent = 'granted' | 'denied';

const CONSENT_KEY = 'adConsent';
const CONSENT_AT_KEY = 'adConsentAt';
const REASK_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours

export function getAdConsent(): AdConsent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {}
  return null;
}

export function getAdConsentAt(): number | null {
  try {
    const t = localStorage.getItem(CONSENT_AT_KEY);
    return t ? Number(t) : null;
  } catch {}
  return null;
}

export function setAdConsent(status: AdConsent): void {
  try {
    localStorage.setItem(CONSENT_KEY, status);
    localStorage.setItem(CONSENT_AT_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('supportAds:changed', { detail: { status } }));
  } catch {}
}

export function shouldPromptForConsent(): boolean {
  const status = getAdConsent();
  if (!status) return true;
  if (status === 'granted') return false;
  const at = getAdConsentAt();
  if (!at) return true;
  return Date.now() - at > REASK_INTERVAL_MS; // ask again after 48h if denied
}

export function openSupportAdsModal(): void {
  window.dispatchEvent(new CustomEvent('supportAds:open'));
}

// Guards against multiple beacons per pageload
let beaconSent = false;
export function sendBeaconOnce(url: string, slot?: HTMLElement): void {
  if (beaconSent) return;
  try {
    const beacon = new Image();
    beacon.decoding = 'async';
    beacon.referrerPolicy = 'no-referrer-when-downgrade';
    beacon.src = `${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`;
    if (slot) {
      beacon.width = 1;
      beacon.height = 1;
      beacon.style.position = 'absolute';
      beacon.style.opacity = '0';
      slot.appendChild(beacon);
    }
  } catch {}
  beaconSent = true;
}

