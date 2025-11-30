import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-widget',
    lib: {
      entry: path.resolve(__dirname, 'src/widget/index.tsx'),
      name: 'ChatPadWidget',
      formats: ['iife'],
      fileName: () => 'chatpad-widget.min.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        assetFileNames: 'chatpad-widget.css',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging widget
        drop_debugger: true,
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
