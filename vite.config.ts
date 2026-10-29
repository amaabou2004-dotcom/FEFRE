import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Autorise les hôtes d'aperçu (environnements de dev distants / proxys)
    allowedHosts: true,
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    drop: ['debugger'],
  },
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        compact: true,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
