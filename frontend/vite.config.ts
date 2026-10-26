import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "cloudflare-module",
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public",
    },
    cloudflare: {
      nodeCompat: true,
      deployConfig: true,
    },
  },

  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: false,
    },
  },

  vite: {
    server: {
      proxy: {
        "/api": {
          target: process.env.TRIFAIR_DEV_API_PROXY ?? "http://127.0.0.1:8001",
          changeOrigin: true,
        },
      },
    },
  },
});
