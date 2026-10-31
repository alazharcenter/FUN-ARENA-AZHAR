import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Port 3000 = "Site URL" bawaan Supabase, agar tautan konfirmasi email kembali ke aplikasi
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    // Inti aplikasi (React + Supabase) ±150 KB gzip; halaman lain dimuat terpisah saat dibuka
    chunkSizeWarningLimit: 600,
  },
})
