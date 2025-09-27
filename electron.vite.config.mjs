import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/electron/main.js'),
          background: resolve(__dirname, 'src/electron/background/background.js'),
        },
        output: {
          entryFileNames: chunk => {
            if (chunk.name === 'background') return 'background/background.js';
            return '[name].js';
          }
        },
        external: ['auto-launch', 'fs-extra', 'fs', 'path', 'electron', 'discord-rpc'],
      },
    },
    resolve: {
      alias: {
        '@src': resolve(__dirname, 'src'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@resources': resolve(__dirname, 'resources'),
        '@ipcHandlers': resolve(__dirname, 'src/electron/ipcHandlers'),
        '@services': resolve(__dirname, 'src/services'),
        '@context': resolve(__dirname, 'src/context'),
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
        '@resources': resolve(__dirname, 'resources'),
        '@electron': resolve(__dirname, 'src/electron'),
        '@ipcHandlers': resolve(__dirname, 'src/electron/ipcHandlers'),
        '@services': resolve(__dirname, 'src/services'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@features': resolve(__dirname, 'src/features'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@layouts': resolve(__dirname, 'src/layouts'),
        '@components': resolve(__dirname, 'src/components'),
        '@context': resolve(__dirname, 'src/context'),
      },
    },
    plugins: [react(),svgr()],
  },
});
