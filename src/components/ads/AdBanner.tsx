import { useEffect, useRef, useState } from "react";
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
  lazy?: boolean; // only render when visible
  unmountWhenHidden?: boolean; // free resources when off-screen
  rootMargin?: string; // IO rootMargin, e.g., "200px"
};

const AdBanner = ({
  placement,
  className,
  refreshInterval = AD_REFRESH_INTERVAL,
  funnelUrl,
  lazy = true,
  unmountWhenHidden = true,
  rootMargin = "150px",
}: AdBannerProps) => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [uvLink, setUvLink] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // IntersectionObserver to lazily mount/unmount heavy content
  useEffect(() => {
    if (!lazy) return;
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const onVisible = (visible: boolean) => {
      if (!unmountWhenHidden && !visible) return; // keep mounted
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setIsActive(visible));
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        onVisible(entry.isIntersecting);
      },
      { root: null, threshold: 0.05, rootMargin }
    );
    io.observe(el);

    // Also pause when page/tab hidden
    const onVis = () => {
      if (!document.hidden) return;
      if (unmountWhenHidden) setIsActive(false);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lazy, unmountWhenHidden, rootMargin]);

  return (
    <div ref={containerRef as any} className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 w-full h-full">
        {uvLink ? (
          isActive ? (
            <iframe
              src={uvLink}
              className="w-full h-full border-0"
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation"
              title="Sponsored via Ultraviolet"
            />
          ) : null
        ) : isActive ? (
          <div
            key={refreshKey}
            className="w-full h-full"
            data-admaven-placement={placement}
          />
        ) : null}
      </div>
    </div>
  );
};

export default AdBanner;
