import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static, browser-only build. Vercel auto-detects Vite and serves `dist/`.
export default defineConfig({
  plugins: [react()],
});
