import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  publicDir: path.resolve(__dirname, 'public'),
  manifest: {
    name: 'AIBookMarks',
    description: 'AI-powered bookmark organizer',
    version: '1.1.0',
    permissions: [
      'bookmarks',
      'storage',
      'favicon',
    ],
    host_permissions: [],
    action: {
      default_popup: 'popup/index.html',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.browser === 'firefox') {
        manifest.permissions = manifest.permissions?.filter((permission) => permission !== 'favicon');
      }
      // Force open_in_tab: true — WXT auto-generation strips it
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }),
});
