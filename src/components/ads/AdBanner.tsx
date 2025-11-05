import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SCRAMJET_PREFIX, SMARTLINK_URL } from "@/constants";
import { getAdConsent, sendBeaconOnce } from "./consent";

type AdBannerProps = {
  smartlinkUrl?: string;
  className?: string;
};

const AdBanner = ({ smartlinkUrl = SMARTLINK_URL, className }: AdBannerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [frameSrc, setFrameSrc] = useState<string>("");
  // no-op state retained in earlier versions
  const [beaconStatus, setBeaconStatus] = useState<'pending' | 'ok' | 'failed'>('pending');

  // Consent reactive
  useEffect(() => {
    const check = () => setShouldRender(getAdConsent() === "granted");
    check();
    const onChanged = () => check();
    window.addEventListener("supportAds:changed", onChanged as EventListener);
    window.addEventListener("storage", onChanged);
    return () => {
      window.removeEventListener("supportAds:changed", onChanged as EventListener);
      window.removeEventListener("storage", onChanged);
    };
  }, []);

  // When permitted, send beacon and render via Scramjet
  useEffect(() => {
    if (!shouldRender) return;
    const slot = containerRef.current || undefined;
    setBeaconStatus('pending');
    (async () => {
      const ok = await sendBeaconOnce(smartlinkUrl, slot);
      if (!ok) {
        setBeaconStatus('failed');
        return;
      }
      setBeaconStatus('ok');
      const base = SCRAMJET_PREFIX.endsWith('/') ? SCRAMJET_PREFIX : `${SCRAMJET_PREFIX}/`;
      const src = `${base}${encodeURIComponent(smartlinkUrl)}`;
      setFrameSrc(src);
      // no-op
    })();
  }, [shouldRender, smartlinkUrl]);

  if (!shouldRender) return null;

  return (
    <div ref={containerRef} data-ad-slot className={cn("relative overflow-hidden", className)}>
      {beaconStatus === 'failed' ? null : beaconStatus === 'ok' ? (
        <iframe
          src={frameSrc}
          className="w-full h-full border-0"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
          title="Sponsored"
        />
      ) : null}
    </div>
  );
};

export default AdBanner;
