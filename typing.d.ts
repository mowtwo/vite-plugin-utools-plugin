import { Plugin } from "vite";

export default function vitePluginUtoolsPlugin(isDev: boolean, options?: {
  /**
   * 是否创建默认的plugin.json文件
   * @default true
   */
  createDefaultPluginJson?: boolean
  /**
   * 是否创建默认的preload.js文件
   * @default false
   */
  createDefaultPreload?: boolean
  /**
   * 是否注入默认的logo
   * @default true
   */
  injectDefaultLogo?: boolean
  /**
   * 是否转换成cjs模式
   * 在vite下，打包后的文件是esm，但是utools只支持cjs，所以需要转换
   * @default true
   */
  safePatchToCjs?: boolean
  /**
   * 是否强制重新创建默认的plugin.json跟preload.js文件
   * @default false
   */
  forceRestore?: boolean
  /**
   * 是否只在dev环境下进行生成
   * @default false
   */
  onlyDev?: boolean
  /**
   * 是否强制使用相对路径
   * @default true
   */
  forceUsingRelativePath?: boolean
  /**
   * 是否开启日志输出
   * @default true
   */
  logging: boolean
}): Plugin
