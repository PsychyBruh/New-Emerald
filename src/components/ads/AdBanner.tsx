import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    admaven?: {
      render?: () => void;
      refresh?: () => void;
      push?: (command: unknown) => void;
    };
  }
}

// Auto-refresh disabled per request
export const AD_REFRESH_INTERVAL = 0;

type AdBannerProps = {
  placement: string;
  className?: string;
  refreshInterval?: number;
  funnelUrl?: string; // raw target URL to funnel via UV
};

const AdBanner = ({
  placement,
  className,
  refreshInterval = AD_REFRESH_INTERVAL,
  funnelUrl,
}: AdBannerProps) => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [uvLink, setUvLink] = useState<string | null>(null);

  // Disable periodic refresh: only render once per mount/placement change
  useEffect(() => {
    // no-op: intentionally not setting an interval
  }, [refreshInterval]);

  useEffect(() => {
    setRefreshKey(Date.now());
  }, [placement]);

  // Build a Ultraviolet-funneled link for the provided URL
  useEffect(() => {
    if (!funnelUrl) {
      setUvLink(null);
      return;
    }
    try {
      const encoded = encodeURIComponent(funnelUrl);
      // Matches how the app routes to proxies: /~/{proxy}/{encoded}
      // Default to uv path
      setUvLink(`/~/uv/${encoded}`);
    } catch {
      setUvLink(null);
    }
  }, [funnelUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const admaven = window.admaven;
    if (!admaven) return;
    try {
      if (typeof admaven.render === "function") {
        admaven.render();
      } else if (typeof admaven.push === "function") {
        admaven.push({ event: "render" });
      }
    } catch {}
  }, [placement]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 w-full h-full">
        {uvLink ? (
          <iframe
            src={uvLink}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
            title="Sponsored via Ultraviolet"
          />
        ) : (
          <div
            key={refreshKey}
            className="w-full h-full"
            data-admaven-placement={placement}
          />
        )}
      </div>
    </div>
  );
};

export default AdBanner;
