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
};

const AdBanner = ({
  placement,
  className,
  refreshInterval = AD_REFRESH_INTERVAL,
}: AdBannerProps) => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  // Disable periodic refresh: only render once per mount/placement change
  useEffect(() => {
    // no-op: intentionally not setting an interval
  }, [refreshInterval]);

  useEffect(() => {
    setRefreshKey(Date.now());
  }, [placement]);

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
      <div
        key={refreshKey}
        className="w-full h-full"
        data-admaven-placement={placement}
      />
    </div>
  );
};

export default AdBanner;
