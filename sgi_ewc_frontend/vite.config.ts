import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Vite corre con ESM, pero para alias podemos resolver desde el cwd (no longer needed)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': '/src/app',
      '@features': '/src/features',
      '@shared': '/src/shared',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
