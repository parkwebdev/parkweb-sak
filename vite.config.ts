import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use esbuild for minification (default, but explicit)
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        widget: path.resolve(__dirname, 'widget.html'),
      },
      output: {
        // Optimize chunk names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Separate widget bundle from main app
          if (id.includes('widget-entry') || id.includes('src/widget/') || id.includes('src/pages/WidgetPage')) {
            return 'widget';
          }
          // Let Vite auto-split shared deps (react, supabase) into smaller chunks
          // DO NOT force all node_modules into one vendor chunk - this was causing
          // the widget to load 872KB of unused main app dependencies
        },
      },
    },
  },
  // Production optimizations: strip console logs and debugger statements
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  // Prebundle Mapbox dependencies to avoid dynamic import resolution issues
  optimizeDeps: {
    include: ['@vis.gl/react-mapbox', 'mapbox-gl'],
  },
}));
