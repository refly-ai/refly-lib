import type { Plugin } from 'vite';

const pkg = require('../../package.json');

interface PluginOption {
  filesPath?: string[]; // File to transform
}

export default function vitePluginWatcher(options: PluginOption): Plugin {
  return {
    name: pkg.name,

    buildStart() {
      options.filesPath.forEach((filePath) => this.addWatchFile(filePath));
    },
  };
}
