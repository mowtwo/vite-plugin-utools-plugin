/**
 * 插件配置
 */
export interface Options {
  /**
   * 开发模式下的缓存文件路径
   * 当使用public时，会在public下创建一个utools文件夹进行特殊处理
   * @default ".utools"
   */
  devDir?: '.utools' | 'public' | (string & {})
  /**
   * 是否先删除devDir再启动
   * @default true
   */
  clean?: boolean
  /**
   * build配置
   */
  build?: {
    /**
     * 打包时，是否自动设置base为相对路径
     * @default true
     */
    relativeBasePath?: boolean
    /**
     * 是否在打包后，需要同步npm dependencies
     * @default false
     */
    syncNpmDeps?: boolean
  }
  /**
   * server配置
   */
  server?: {
    /**
     * 启动的服务地址
     * @default "localhost"
     */
    host?: string
    /**
     * 启动端口
     */
    port?: number
  }
  /**
   * utools相关配置
   */
  utools?: {
    /**
     * plugin.json 初次生成时，main跟development.main配置对应的地址路径
     * @default "index.html"
     */
    main?: string
    /**
     * plugin.json 初次生成时，所指向的schema地址
     * @default "../node_modules/utools-api-types/resource/utools.schema.json"
     */
    jsonSchemaPath?: string
  }
  tsup?: {
    /**
     * 打包preload的时候，哪些库是需要跟随打包的
     */
    noExternal?: (string | RegExp)[]
    /**
     * 输出的代码兼容的nodejs版本
     * @default 14
     */
    nodeVersion?: number
    ignoreEntry?: string | RegExp | Array<string | RegExp> | ((entry: string, isDev: boolean) => boolean)
  }
}
