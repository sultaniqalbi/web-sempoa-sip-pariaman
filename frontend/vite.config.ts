import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function asyncCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-async-css',
    enforce: 'post',
    transformIndexHtml(html: string) {
      return html.replace(
        /<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="preload" as="style" href="$1"><link rel="stylesheet" href="$1" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), asyncCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://backend:8000',
        changeOrigin: true
      }
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query', 'axios']
        }
      }
    }
  }
})
