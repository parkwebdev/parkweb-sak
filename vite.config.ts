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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        widget: path.resolve(__dirname, 'widget.html'),
      },
      output: {
        manualChunks: (id) => {
          // Separate widget bundle from main app
          if (id.includes('widget-entry') || id.includes('src/widget/') || id.includes('src/pages/WidgetPage')) {
            return 'widget';
          }
          // Keep node_modules in vendor chunk for main app
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
