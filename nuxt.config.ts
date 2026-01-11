import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },
  runtimeConfig: {
    openaiApiKey: process.env.NUXT_PUBLIC_OPENAI_API_KEY,
    public: {
      openaiApiKey: process.env.NUXT_PUBLIC_OPENAI_API_KEY,
    },
  },
  modules: ["@nuxtjs/supabase", "@clerk/nuxt", "@vite-pwa/nuxt", "@pinia/nuxt", "@nuxt/eslint"],
  pwa: {
    manifest: {
      name: "Currently",
      short_name: "Currently",
      description: "Voice-powered task management",
      theme_color: "#ffffff",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  supabase: {
    redirect: false,
  },
  components: {
    dirs: [
      {
        path: "./app/components",
        ignore: ["**/*.ts"],
      },
    ],
  },
  alias: {
    "@": fileURLToPath(new URL("./app", import.meta.url)),
  },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
      autoprefixer: {},
    },
  },
});
