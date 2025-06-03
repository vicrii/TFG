import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false, // Deshabilita el overlay de errores
    },
    // Reduce la verbosidad de los logs
    logger: {
      transports: [
        {
          level: 'error', // Solo muestra errores (no warnings ni info)
        },
      ],
    },
  },
  // Silenciar advertencias comunes
  optimizeDeps: {
    // No excluir web3.js para evitar problemas de importación
    include: ['eventemitter3'],
  },
  // NO configurar NODE_ENV como production para no romper HMR
  build: {
    sourcemap: false,
    rollupOptions: {
      // Minimizar advertencias de rollup
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  }
})
