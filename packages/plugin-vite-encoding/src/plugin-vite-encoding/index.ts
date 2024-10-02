import type { Plugin } from 'vite';
import type { OutputChunk, OutputAsset } from 'rollup';

const pkg = require('../../package.json');

export function toUtf8(str: string) {
  return str
    .split('')
    .map((ch) => (ch.charCodeAt(0) <= 0x7f ? ch : '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4)))
    .join('');
}

interface PluginOption {
  filePatterns?: (string | RegExp)[]; // File to transform
}

export default function vitePluginEncoding(options: PluginOption): Plugin {
  return {
    name: pkg.name,

    generateBundle(_, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file] as OutputAsset | OutputChunk;

        let shouldTransform = false;

        for (const pattern of options.filePatterns) {
          if (file.match(new RegExp(pattern))) {
            shouldTransform = true;
          }
        }

        if (!shouldTransform) {
          continue;
        }

        // 如果是 JavaScript 文件
        if (chunk.type === 'chunk' && chunk?.code && /\.js$/.test(file)) {
          // 将内容转换为 UTF-8 编码
          const utf8Content = toUtf8(chunk.code as string);
          chunk.code = utf8Content;
        }
      }
    },
  };
}
