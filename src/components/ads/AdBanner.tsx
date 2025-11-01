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

export const AD_REFRESH_INTERVAL = 35_000;

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRefreshKey(Date.now());
    }, refreshInterval);

    return () => window.clearInterval(intervalId);
  }, [refreshInterval]);

  useEffect(() => {
    setRefreshKey(Date.now());
  }, [placement]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const admaven = window.admaven;
    if (!admaven) return;
    try {
      if (typeof admaven.render === "function") {
        admaven.render();
      } else if (typeof admaven.refresh === "function") {
        admaven.refresh();
      } else if (typeof admaven.push === "function") {
        admaven.push({ event: "render" });
      }
    } catch (error) {
      console.warn("Ad refresh failed", error);
    }
  }, [refreshKey]);

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
