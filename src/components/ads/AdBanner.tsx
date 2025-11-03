import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AD_IFRAME_TIMEOUT_MS, SCRAMJET_PREFIX, SMARTLINK_URL } from "@/constants";
import { getAdConsent, sendBeaconOnce } from "./consent";

type AdBannerProps = {
  smartlinkUrl?: string;
  className?: string;
};

const AdBanner = ({ smartlinkUrl = SMARTLINK_URL, className }: AdBannerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

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
    // 1) Beacon first
    sendBeaconOnce(smartlinkUrl, slot);
    // 2) Scramjet iframe next
    const base = SCRAMJET_PREFIX.endsWith('/') ? SCRAMJET_PREFIX : `${SCRAMJET_PREFIX}/`;
    const src = `${base}${encodeURIComponent(smartlinkUrl)}`;
    setFrameSrc(src);
    setLoaded(false);
    // Fallback disabled: always prefer iframe
    return () => {};
  }, [shouldRender, smartlinkUrl]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {!shouldRender ? null : (
        <iframe
          src={frameSrc}
          className="w-full h-full border-0"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
          title="Sponsored"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
};

export default AdBanner;
