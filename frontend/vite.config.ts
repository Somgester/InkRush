import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset paths so the production build works when served
  // from a subpath or static host (e.g. Render, GitHub Pages)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
