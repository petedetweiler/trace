import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The complete non-brand Tabler catalog is intentionally kept in a lazy
    // chunk so the editor can offer visual search without inflating startup.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@codemirror') || id.includes('/codemirror/') || id.includes('@lezer')) {
            return 'editor'
          }
          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react'
          }
          if (
            id.includes('@dagrejs') ||
            id.includes('/yaml/') ||
            id.includes('/dompurify/') ||
            id.includes('@traceflow')
          ) {
            return 'diagram'
          }
        },
      },
    },
  },
})
