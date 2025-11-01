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
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="flex flex-col items-stretch gap-3 w-full h-full">
        {/* Built-in UV funnel link banner (if provided) */}
        {uvLink && (
          <a
            href={uvLink}
            target="_self"
            rel="noopener"
            className="block text-center text-sm rounded-lg px-3 py-2 border border-border/40 bg-card/80 hover:bg-card transition-colors shadow-sm"
          >
            Sponsored: Open via Ultraviolet
          </a>
        )}
        {/* Original ad placement */}
        <div
          key={refreshKey}
          className="w-full h-full"
          data-admaven-placement={placement}
        />
        {/* Mirror the UV link at the bottom so both show in the banner */}
        {uvLink && (
          <a
            href={uvLink}
            target="_self"
            rel="noopener"
            className="block text-center text-sm rounded-lg px-3 py-2 border border-border/40 bg-card/80 hover:bg-card transition-colors shadow-sm"
          >
            Try the link through UV
          </a>
        )}
      </div>
    </div>
  );
};

export default AdBanner;
