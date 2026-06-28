import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-pdf': ['pdf-lib'],
          'vendor-xlsx': ['xlsx'],
          'vendor-zip': ['jszip'],
          'vendor-redux': ['redux', 'react-redux', 'redux-persist', 'redux-thunk'],
        },
      },
    },
  },
})
