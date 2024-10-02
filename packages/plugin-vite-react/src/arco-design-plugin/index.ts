import type { Plugin, ResolvedConfig, UserConfig, ConfigEnv } from 'vite';
import { modifyCssConfig } from './less';
import { modifyIconConfig, loadIcon } from './icon';
import { emptyTransformJsFiles, transformCssFile, transformJsFiles } from './transform';

const pkg = require('../../package.json');

type Vars = Record<string, any>;
type Style = boolean | 'css';

interface PluginOption {
  theme?: string; // Theme package name
  iconBox?: string; // Icon library package name
  modifyVars?: Vars; // less modifyVars
  style?: Style; // Style lazy load
  filePatterns?: (string | RegExp)[]; // File to transform
  varsInjectScope?: (string | RegExp)[]; // Less vars inject
  sourceMaps?: boolean;
}

export default function vitePluginArcoImport(options: PluginOption = {}): Plugin {
  const { theme = '', iconBox = '', modifyVars = {}, style = true, varsInjectScope = [] } = options;
  let iconBoxLib: any;
  let resolvedConfig: ResolvedConfig;
  let isDevelopment = false;

  if (iconBox) {
    try {
      iconBoxLib = require(iconBox); // eslint-disable-line
    } catch (e) {
      throw new Error(`IconBox ${iconBox} not existed`);
    }
  }
  return {
    name: pkg.name,
    config(config: UserConfig, { command }: ConfigEnv) {
      // dev mode
      isDevelopment = command === 'serve';

      // css preprocessorOptions
      modifyCssConfig(pkg.name, config, theme, modifyVars, varsInjectScope);

      // iconbox
      modifyIconConfig(config, iconBox, iconBoxLib);
    },
    async load(id: string) {
      const res = loadIcon(id, iconBox, iconBoxLib);
      if (res !== undefined) {
        return res;
      }
      // other ids should be handled as usually
      return null;
    },
    configResolved(config: ResolvedConfig) {
      resolvedConfig = config;
      // console.log('viteConfig', resolvedConfig)
    },
    transform(code, id) {
      let shouldTransform = false;

      for (const pattern of options.filePatterns) {
        if (id.match(pattern)) {
          shouldTransform = true;
        }
      }

      // Do not transform packages in this monorepo!
      if (!shouldTransform) {
        return emptyTransformJsFiles({
          id,
          code,
          isDevelopment,
          sourceMaps: options.sourceMaps || isDevelopment || Boolean(resolvedConfig?.build?.sourcemap),
        });
      }

      // transform css files
      const res = transformCssFile({
        code,
        id,
        theme,
      });
      if (res !== undefined) {
        return res;
      }

      // css lazy load
      return transformJsFiles({
        code,
        id,
        theme,
        style,
        isDevelopment,
        sourceMaps: options.sourceMaps || isDevelopment || Boolean(resolvedConfig?.build?.sourcemap),
      });
    },
  };
}
