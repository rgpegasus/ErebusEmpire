import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      lib: {
        entry: resolve(__dirname, 'src/electron/main.js'),
        formats: ['cjs'],
        fileName: () => 'main.js'
      },
    },
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@ipcHandlers': resolve(__dirname, 'src/electron/ipcHandlers'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve(__dirname, 'src/electron/preload.js'),
        output: {
          format: 'cjs',
          entryFileNames: 'preload.js'
        }
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: resolve(__dirname, 'src/electron'),
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'src/electron/index.html'),
        output: {
          format: 'cjs',
          entryFileNames: 'renderer.js'
        }
      },
    },
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
        '@electron': resolve(__dirname, 'src/electron'),
        '@ipcHandlers': resolve(__dirname, 'src/electron/ipcHandlers'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@features': resolve(__dirname, 'src/features'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@layouts': resolve(__dirname, 'src/layouts'),
        '@components': resolve(__dirname, 'src/components'),
      },
    },
    plugins: [react()],
  },
});