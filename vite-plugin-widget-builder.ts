import { Plugin, build } from 'vite';
import path from 'path';
import fs from 'fs';

export function widgetBuilder(): Plugin {
  return {
    name: 'widget-builder',
    apply: 'build',
    async closeBundle() {
      console.log('Building widget bundle...');
      
      // Build widget bundle after main build
      await build({
        configFile: path.resolve(__dirname, 'vite.widget.config.ts'),
        mode: 'production',
      });
      
      console.log('Copying widget bundle to public folder...');
      
      // Copy to public folder
      const src = path.resolve(__dirname, 'dist-widget/chatpad-widget.js');
      const dest = path.resolve(__dirname, 'public/chatpad-widget.js');
      
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Widget bundle deployed to public/chatpad-widget.js');
      } else {
        console.error('Widget bundle not found at:', src);
      }
    }
  };
}
