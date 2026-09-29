import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 1. Не пре-бандлить maplibre-gl — иначе воркер не найдётся в dev-режиме
  optimizeDeps: {
    exclude: ['maplibre-gl'],
    esbuildOptions: {
      // 2. Без этого esbuild может сломать воркер через __publicField
      target: 'es2022',
    },
  },

  build: {
    // 3. Тот же target для production-сборки
    target: 'es2022',
  },

  worker: {
    // 4. MapLibre v6 создаёт воркер как ES-модуль
    format: 'es',
  },
});
