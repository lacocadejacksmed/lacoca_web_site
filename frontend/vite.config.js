import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('exceljs') || id.includes('jspdf') || id.includes('file-saver')) {
              return 'vendor-exports';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('leaflet') || id.includes('@turf')) {
              return 'vendor-maps';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            return 'vendor'; // El resto de dependencias
          }
        }
      }
    }
  }
})
