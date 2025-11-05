import { SCRAMJET_PREFIX } from '@/constants';

export async function loadScriptViaScramjet(url: string): Promise<boolean> {
  try {
    const base = SCRAMJET_PREFIX.endsWith('/') ? SCRAMJET_PREFIX : `${SCRAMJET_PREFIX}/`;
    const proxied = `${base}${encodeURIComponent(url)}`;
    const res = await fetch(proxied, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const code = await res.text();
    try {
      // Execute in global scope
      const fn = new Function(code);
      fn();
      return true;
    } catch (err) {
      console.warn('Ad injection eval failed', err);
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.textContent = code;
      document.head.appendChild(s);
      return true;
    }
  } catch (err) {
    console.warn('Ad script load failed', err);
    return false;
  }
}

