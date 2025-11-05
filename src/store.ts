import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingValues {
  version: string;
  proxy: "uv" | "scramjet";
  transport: {
    path: "/libcurl/index.mjs" | "/epoxy/index.mjs";
    name: "libcurl" | "epoxy";
  };
  cloak: "none" | "aboutBlank";
  siteType: "browser" | "default";
  title: string;
  icon: string;
  searchEngine: {
    name: string;
    url: string;
  };
  wispUrl: string;
  allowTabReordering: boolean;
  autoRefreshAds: boolean;
}

interface SettingSetters {
  setVersion: (version: string) => void;
  setProxy: (proxy: "uv" | "scramjet") => void;
  setTransport: (
    path: "/libcurl/index.mjs" | "/epoxy/index.mjs",
    name: "libcurl" | "epoxy"
  ) => void;
  setCloak: (cloak: "none" | "aboutBlank") => void;
  setSiteType: (siteType: "browser" | "default") => void;
  setTitle: (title: string) => void;
  setIcon: (icon: string) => void;
  setWispUrl: (wispUrl: string) => void;
  setSearchEngine: (name: string, url: string) => void;
  setDefault: () => void;
  setAllowTabReordering: (allow: boolean) => void;
  setAutoRefreshAds: (on: boolean) => void;
}

const DEFAULT_SETTINGS: SettingValues = {
  version: "1.0.0",
  proxy: "uv",
  transport: {
    path: "/libcurl/index.mjs",
    name: "libcurl",
  },
  allowTabReordering: false,
  cloak: "none",
  siteType: "browser",
  title: "Emerald ✨",
  icon: "/emerald.png",
  searchEngine: {
    name: "DuckDuckgo",
    url: "https://duckduckgo.com/?q=",
  },
  wispUrl: `${location.protocol.includes("https") ? "wss://" : "ws://"}${
    location.host
  }/w/`,
  autoRefreshAds: false,
};

type SettingsStore = SettingValues & SettingSetters;

const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      version: "1.0.0",
      setVersion: (version: string) => set(() => ({ version })),
      proxy: "scramjet",
      transport: {
        path: "/libcurl/index.mjs",
        name: "libcurl",
      },
      allowTabReordering: false,
      setAllowTabReordering: (allow: boolean) =>
        set(() => ({ allowTabReordering: allow })),
      setTransport: (
        path: "/libcurl/index.mjs" | "/epoxy/index.mjs",
        name: "libcurl" | "epoxy"
      ) => set(() => ({ transport: { path, name } })),
      cloak: "none",
      siteType: "browser",
      setSiteType: (siteType: "browser" | "default") =>
        set(() => ({ siteType })),
      setCloak: (cloak: "none" | "aboutBlank") => set(() => ({ cloak })),
      title: "Emerald ✨",
      setTitle: (title: string) => set(() => ({ title })),
      icon: "/emerald.png",
      setIcon: (icon: string) => set(() => ({ icon })),
      searchEngine: {
        name: "DuckDuckgo",
        url: "https://duckduckgo.com/?q=",
      },
      // defaults to current websites wisp url
      wispUrl: `${location.protocol.includes("https") ? "wss://" : "ws://"}${
        location.host
      }/w/`,
      setWispUrl: (wispUrl: string) => set(() => ({ wispUrl })),
      setProxy: (proxy: "uv" | "scramjet") => set(() => ({ proxy })),
      setSearchEngine: (name: string, url: string) =>
        set(() => ({
          searchEngine: {
            name,
            url,
          },
        })),
      autoRefreshAds: false,
      setAutoRefreshAds: (on: boolean) => set(() => ({ autoRefreshAds: on })),
      setDefault: () => set(() => DEFAULT_SETTINGS),
    }),
    {
      name: "settings",
      version: 3,
      migrate: (persisted: any, version: number) => {
        try {
          // Ensure DuckDuckGo is the default for existing users (one-time migration)
          if (version < 2) {
            if (!persisted || typeof persisted !== 'object') return persisted;
            persisted.searchEngine = {
              name: "DuckDuckgo",
              url: "https://duckduckgo.com/?q=",
            };
          }
          if (version < 3) {
            if (!persisted || typeof persisted !== 'object') return persisted;
            if (typeof persisted.autoRefreshAds !== 'boolean') {
              persisted.autoRefreshAds = false;
            }
          }
        } catch {
          // ignore and proceed with existing state
        }
        return persisted;
      },
    }
  )
);

export { useSettings };
