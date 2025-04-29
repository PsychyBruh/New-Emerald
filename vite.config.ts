import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
//@ts-expect-error ts being ts
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  base: "/emerald/",      // ← ensures all asset URLs are prefixed with /emerald/

  plugins: [
    react(),
    TanStackRouterVite(),
    ViteImageOptimizer({
      logStats: true,
      cache: true,
      cacheLocation: path.resolve(__dirname, ".cache"),
    }),
    viteStaticCopy({
      targets: [
        {
          src: `${uvPath}/**/*`.replace(/\\/g, "/"),
          dest: "uv",
          overwrite: false,
        },
        {
          src: `${baremuxPath}/**/*`.replace(/\\/g, "/"),
          dest: "baremux",
          overwrite: false,
        },
        {
          src: `${libcurlPath}/**/*`.replace(/\\/g, "/"),
          dest: "libcurl",
          overwrite: false,
        },
        {
          src: `${epoxyPath}/**/*`.replace(/\\/g, "/"),
          dest: "epoxy",
          overwrite: false,
        },
      ],
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api/": {
        target: "http://localhost:3000/",
      },
      "/w/": {
        target: "http://localhost:3000/",
        rewrite: (p) => p.replace(/^\/w/, ""),
        ws: true,
      },
      "/cdn/": {
        target: "http://localhost:3000/",
        rewrite: (p) => p.replace(/^\/cdn/, ""),
      },
    },
    allowedHosts: [
      "*", // Allow any host
      "psychy.tail2c9bfb.ts.net",
    ],
    strictPort: false,
  },

  build: {
    outDir: "dist",       // production build directory
    emptyOutDir: true,
  },
});
