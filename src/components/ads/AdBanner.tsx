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
  const [fallback, setFallback] = useState(false);
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
    const src = `${SCRAMJET_PREFIX.replace(/\/$/, "")}/b/s/${smartlinkUrl}`;
    setFrameSrc(src);
    setFallback(false);
    setLoaded(false);

    // 3) Fallback if blocked or slow
    const id = window.setTimeout(() => {
      if (!loaded) setFallback(true);
    }, AD_IFRAME_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [shouldRender, smartlinkUrl]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {!shouldRender ? null : fallback ? (
        <div className="w-full h-full flex items-center justify-center bg-card/60 border border-border/40 rounded-xl">
          <div className="text-center px-3 py-2">
            <div className="text-xs uppercase opacity-70">Sponsored</div>
            <button
              className="mt-2 text-sm px-3 py-1 rounded-md bg-primary/80 hover:bg-primary text-white shadow"
              onClick={() => window.open(`${SCRAMJET_PREFIX}/b/s/${smartlinkUrl}`, "_blank", "noopener")}
            >
              Visit
            </button>
          </div>
        </div>
      ) : (
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
