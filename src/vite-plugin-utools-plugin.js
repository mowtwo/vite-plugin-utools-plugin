import fs from 'fs'
import path from 'path'
import ora from 'ora'
import url from 'url'


export default function vitePluginUtoolsPlugin(isDev, options = {}) {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const _package = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
  let distDir = ''
  const {
    createDefaultPluginJson = true,
    createDefaultPreload = false,
    injectDefaultLogo = true,
    safePatchToCjs = true,
    forceRestore = false,
    onlyDev = false,
    forceUsingRelativePath = true,
    logging = true,
  } = options

  if (logging) {
    ora(
      `[${_package.name}] 开发模式 = ${!!isDev}`
    ).warn()
  }

  const autoInjectFiles = (publicDir, host, port) => {
    if (onlyDev && !isDev) {
      return
    }
    const pluginJsonPath = path.join(publicDir, 'plugin.json')
    const preloadPath = path.resolve(publicDir, 'preload.js')

    if (forceRestore) {
      const o = ora('强制重建默认的plugin.json跟preload.js').start()
      if (fs.existsSync(pluginJsonPath)) {
        fs.rmSync(pluginJsonPath, {
          recursive: true,
        })
      }
      if (fs.existsSync(preloadPath)) {
        fs.rmSync(preloadPath, {
          recursive: true,
        })
      }
      o.succeed()
    }
    if (createDefaultPluginJson) {

      const nodeModulesPath = path.relative(
        publicDir,
        path.resolve(process.cwd(), 'node_modules'),
      )
      if (!fs.existsSync(pluginJsonPath)) {
        const o = ora(
          '创建默认的plugin.json'
        ).start()

        const schemaPath = path.join(
          nodeModulesPath,
          _package.name,
          'resource/utools-plugin.schema.json'
        ).replace(/\\/g, '/')

        const devServerUrl = `http://${host}:${port}/`

        const pluginJson = {
          "$schema": schemaPath,
          "logo": "logo.png",
          "main": "index.html",
          "development": {
            "url": devServerUrl
          },
          "features": [
            {
              "code": "hello",
              "cmds": [
                "hello"
              ]
            }
          ]
        }

        if (createDefaultPreload) {
          pluginJson.preload = 'preload.js'
          if (!fs.existsSync(preloadPath)) {
            const o = ora('创建默认的preload.js').start()
            fs.writeFileSync(preloadPath, '// preload.js', { encoding: 'utf-8' })
            o.succeed()
          }
        }
        fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2), { encoding: 'utf-8' })
        o.succeed()
      }
    }
    if (safePatchToCjs) {
      const o = ora('将插件入口文件转换为cjs').start()
      const packageJsonPath = path.resolve(publicDir, 'package.json')
      let packageJson = {}
      if (fs.existsSync(packageJsonPath)) {
        const o = ora('package.json已存在，修改package.json').start()
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }))
        packageJson.type = 'commonjs'
        o.succeed()
      } else {
        const o = ora('package.json不存在，创建package.json').start()
        packageJson.type = 'commonjs'
        o.succeed()
      }
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      o.succeed()
    }
    if (injectDefaultLogo) {
      const defaultLogoPath = path.resolve(__dirname, '../resource', 'logo.png')
      const logoPath = path.resolve(publicDir, 'logo.png')
      if (!fs.existsSync(logoPath)) {
        const o = ora(`添加默认logo文件`).start()
        fs.copyFileSync(defaultLogoPath, logoPath)
        o.succeed()
      }
    }
  }

  return [
    {
      name: 'vite-plugin-utools-plugin',
      config(config) {

        if (forceUsingRelativePath && !isDev) {
          ora(`打包强制使用相对路径`).start().info()
          if (config.base === undefined) {
            config.base = './'
          } else {
            if (config.base.startsWith('/')) {
              config.base = '.' + config.base
            }
          }
        }
        return config
      },
      configResolved(config) {
        distDir = path.resolve(config.root, config.build.outDir)

        // 获取public
        const publicDir = path.resolve(config.root, config.publicDir)

        let host = ''

        // 获取开发模式localhost地址
        if (config.server.host) {
          host = config.server.host
        } else {
          host = 'localhost'
        }
        let port = ''
        // 获取开发模式端口
        if (config.server.port) {
          port = String(config.server.port)
        } else {
          port = '5173'
        }

        autoInjectFiles(publicDir, host, port)
        return config
      },
      closeBundle() {
        if (!isDev) {
          const pluginJsonPath = path.resolve(distDir, 'plugin.json')
          if (fs.existsSync(pluginJsonPath)) {
            const o = ora({
              prefixText: '[vite-plugin-utools]',
              text: '正在优化plugin.json',
              color: 'green'
            })
            o.start()
            const json = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))
            delete json.development
            fs.writeFileSync(pluginJsonPath, JSON.stringify(json, null, 2))
            o.succeed('优化plugin.json成功')
          }
        }
      }
    }
  ]
}

