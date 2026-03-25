import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // TAMBAHIN PLUGIN DECORATORS DI SINI
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate", // Otomatis update service worker kalo ada versi baru
      devOptions: {
        enabled: true, // Wajib true biar kita bisa ngetes PWA-nya di localhost (npm run dev)
      },
      manifest: {
        name: "My Notes App Offline",
        short_name: "Notes",
        description: "Aplikasi pencatat super canggih anti offline",
        theme_color: "#f9fafb", // Warna background-gray-50 dari Tailwind
        background_color: "#f9fafb",
        display: "standalone", // Biar pas di-install, app-nya gak keliatan kayak browser (gak ada address bar)
        icons: [
          // Nanti lu butuh 2 gambar icon ini taruh di folder public/
          {
            src: "notes.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "notes.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Ini yang bikin UI lu tetep bisa dibuka pas offline!
        // Dia nge-cache semua file HTML, JS, CSS, gambar, dan icon
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
