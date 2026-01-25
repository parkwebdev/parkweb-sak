import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Bundle analyzer - generates dist/stats.html after build
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false, // Don't auto-open in browser
    }),
    // PWA with custom service worker for push notifications
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase limit for large vendor chunks (pdf-vendor is ~2.4MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      includeAssets: ['favicon.ico', 'notification-icon.png', 'apple-touch-icon.png'],
      manifest: false, // Use existing site.webmanifest
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
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
          
          // PDF libraries - only loaded by ReportBuilder
          if (id.includes('@react-pdf') || id.includes('pdfjs-dist') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          
          // Map library - lazy loaded via VisitorLocationMapWrapper
          if (id.includes('maplibre-gl')) {
            return 'map-vendor';
          }
          
          // Rich text editor - lazy loaded via RichTextEditorWrapper
          if (id.includes('@tiptap')) {
            return 'editor-vendor';
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
}));
