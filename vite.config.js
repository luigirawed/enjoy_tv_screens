import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment under /<repo-name>/
  // Change this to '/' if using a custom domain
  base: '/enjoy_tv_screens/',
})
