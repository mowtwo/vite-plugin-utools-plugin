import { Plugin } from 'vite'
import { pluginName } from './constant'
import path from 'node:path'
import fs from 'node:fs/promises'
import { build } from 'tsup'
import { Options } from './typing'
import ora from 'ora'
import { buildPluginJson, distPluginJson, writePluginJson } from './pluginjson'
import { globby } from 'globby'
import { buildCode } from './tsup'
import chokidar, { FSWatcher } from 'chokidar'
import cp from 'node:child_process'

const logger = ora({
  prefixText: `[utools]`,
})

/**
 *
 * @param logo 插件logo地址，会在运行时进行扫描并复制到source目录下
 * @param source utools相关开发文件所在的文件夹
 * @param options 其他配置项
 * @returns
 */
export default function vitePluginUtoolsPlugin(
  logo: string,
  source: string,
  options?: Options
): Plugin {

  const resolveProjectPath = (target: string) =>
    path.resolve(process.cwd(), target)
  const safeDirPath = (target: string) =>
    target.endsWith('/') ? target.slice(0, target.length - 1) : target

  const dirPathExisted = (target: string) =>
    fs.stat(target)
      .then(s =>
        s.isDirectory()
      )
      .catch(() => false)

  const filePathExisted = (target: string) =>
    fs.stat(target)
      .then(s =>
        s.isFile()
      )
      .catch(() => false)

  const ignoreEntry = (entry: string, isDev: boolean): boolean => {
    const optionsIgnoreEntry = options?.tsup?.ignoreEntry
    if (!optionsIgnoreEntry) {
      return false
    }

    const ignoreEntryMatcher = (mather: string | RegExp) => {
      if (typeof mather === 'string') {
        return mather === entry
      }
      return mather.test(entry)
    }

    if (Array.isArray(optionsIgnoreEntry)) {
      return optionsIgnoreEntry.some(matcher => ignoreEntryMatcher(matcher))
    }
    if (typeof optionsIgnoreEntry === 'function') {
      return optionsIgnoreEntry(entry, isDev)
    }

    return ignoreEntryMatcher(optionsIgnoreEntry)
  }

  const safeCjsPackageJsonBuild = async (outDir: string) => {
    const projectPackageJsonPath = resolveProjectPath('package.json')

    if (await filePathExisted(projectPackageJsonPath)) {
      const projectPackageJson = JSON.parse(await fs.readFile(
        projectPackageJsonPath,
        { encoding: 'utf-8' }
      ))

      if (projectPackageJson.type === 'module') {
        logger.warn('根项目路径为esm模式，创建package.json保证兼容')
        await fs.writeFile(
          path.join(
            outDir,
            'package.json'
          ),
          JSON.stringify({
            type: "commonjs"
          }, undefined, 2),
          { encoding: 'utf-8' }
        )

        return projectPackageJson
      }
    }
  }

  let isDev = true
  let logoPath = ''
  let mkDevDirPath = ''
  let mkSourceDirPath = ''
  let watcher: FSWatcher
  let sourceDirLogoPath = ''


  const buildCodeClient = (isDev: boolean, outDir: string, ...codeFiles: string[]) =>
    buildCode(
      isDev,
      outDir,
      options?.tsup?.noExternal ?? [],
      options?.tsup?.nodeVersion ?? 14,
      ...codeFiles
    )

  const scanAllCodeFiles = () => (globby(
    [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ],
    {
      cwd: mkSourceDirPath,
      onlyFiles: true
    }
  ).then(files =>
    files.filter(file =>
      !ignoreEntry(path.join(
        mkSourceDirPath,
        file
      ), isDev)
    )
      .map(file =>
        `${path.relative(
          process.cwd(), mkSourceDirPath
        )}/${file}`)
  ))

  return {
    name: pluginName,
    config(config, env) {
      isDev = env.command !== 'build'
      const relativeBasePath =
        options?.build?.relativeBasePath ?? true

      if (relativeBasePath && !isDev) {
        logger.warn('打包强制使用相对路径')
        if (config.base === void 0) {
          config.base = './'
        } else {
          if (config.base.startsWith('/')) {
            config.base = '.' + config.base
          }
        }
      }

      const server = options?.server ?? {
        host: "localhost"
      }

      config.server ??= {}

      Object.assign(config.server, server)

      logoPath = resolveProjectPath(
        path.relative(
          process.cwd(),
          logo
        )
      )


      return config
    },
    async configResolved(config) {
      const isHttps = Boolean(config.server.https)
      const port = parseInt(
        String(
          config.server.port ?? 5173
        )
      )
      const host = config.server.host ?? 'localhost'


      const utoolsDevServer = `${isHttps ? 'https' : 'http'}//${host}:${port}`

      mkSourceDirPath = resolveProjectPath(source)
      const cleanDevDir = options?.clean ?? true
      let devDir = safeDirPath(options?.devDir ?? '.utools')
      if (devDir === 'public' || devDir === './public' || devDir === '/public') {
        devDir += '/.utools'
      }
      mkDevDirPath = resolveProjectPath(devDir)
      if (cleanDevDir) {
        await fs.rm(mkDevDirPath, {
          force: true,
          recursive: true
        })
      }

      if (!(await dirPathExisted(mkSourceDirPath))) {
        logger.warn(`${source}不存在，创建该文件夹`)
        await fs.mkdir(
          mkSourceDirPath,
          { recursive: true }
        )
      }

      const pluginJsonPath = path.join(
        mkSourceDirPath, 'plugin.json'
      )

      const logoBasename = path.basename(logoPath)

      if (!(await filePathExisted(pluginJsonPath))) {
        await writePluginJson(
          pluginJsonPath,
          buildPluginJson(
            isDev as true,
            logoBasename,
            options?.utools?.main ?? 'index.html',
            utoolsDevServer,
            options?.utools?.jsonSchemaPath ?? '../node_modules/utools-api-types/resource/utools.schema.json'
          )
        )
      } else {
        const pluginjson = JSON.parse(
          await fs.readFile(
            pluginJsonPath,
            { encoding: 'utf-8' }
          )
        )

        const {
          logo,
          $schema,
          main,
          development
        } = JSON.parse(
          buildPluginJson(
            isDev as true,
            logoBasename,
            options?.utools?.main ?? 'index.html',
            utoolsDevServer,
            options?.utools?.jsonSchemaPath ?? '../node_modules/utools-api-types/resource/utools.schema.json'
          )
        )

        await writePluginJson(
          pluginJsonPath,
          JSON.stringify({
            ...pluginjson,
            logo,
            $schema,
            main,
            development
          }, undefined, 2)
        )
      }

      sourceDirLogoPath = path.join(
        mkSourceDirPath,
        logoBasename
      )

      if (logoPath !== sourceDirLogoPath) {
        await fs.copyFile(
          logoPath,
          sourceDirLogoPath
        )
      }

      if (isDev) {
        await fs.mkdir(
          mkDevDirPath,
          { recursive: true }
        )
        await fs.copyFile(
          pluginJsonPath,
          path.join(
            mkDevDirPath, 'plugin.json'
          )
        )
        await fs.copyFile(
          sourceDirLogoPath,
          path.join(
            mkDevDirPath, logoBasename
          )
        )

        await safeCjsPackageJsonBuild(mkDevDirPath)

        const watchFileUpdate = (file: string) => {
          if (['.js', '.ts', '.tsx', '.jsx'].some(ext => file.endsWith(ext))) {
            buildCodeClient(isDev, mkDevDirPath, path.relative(
              process.cwd(), file
            ).replaceAll('\\', '/'))
          }
          if (file === logoPath || file === pluginJsonPath) {
            fs.copyFile(
              file,
              path.join(
                mkDevDirPath,
                path.basename(file)
              )
            )
          }
        }

        watcher = chokidar.watch(mkSourceDirPath)
          .on('change', watchFileUpdate)
          .on('add', watchFileUpdate)
          .on('unlink', (file: string) => {
            if (['.js', '.ts', '.tsx', '.jsx'].some(ext => file.endsWith(ext))) {
              const rmPath = path.join(
                mkDevDirPath,
                path.relative(mkSourceDirPath, file)
              ).replace('.ts', '.js')
                .replace('.jsx', '.js')
                .replace('.tsx', '.js')

              fs.rm(
                rmPath,
                { force: true, recursive: true }
              )
              fs.rm(
                rmPath + '.map',
                { force: true, recursive: true }
              )
            }
            if (file === logoPath || file === pluginJsonPath) {
              fs.rm(
                path.join(
                  mkDevDirPath,
                  path.basename(file)
                ),
                { force: true, recursive: true }
              )
            }
          })
      }
    },
    async closeBundle() {
      watcher?.close()
      const projectDistPath = resolveProjectPath('dist')
      if (!isDev && await dirPathExisted(
        projectDistPath
      )) {
        const distPluginJsonPath = path.join(
          projectDistPath, 'plugin.json'
        )

        const logoBasename = path.basename(logoPath)
        const sourcePluginJsonPath = path.join(mkSourceDirPath, 'plugin.json')
        if (await filePathExisted(sourceDirLogoPath)) {

          const sourcePluginJson = JSON.parse(
            await fs.readFile(
              sourcePluginJsonPath,
              { encoding: 'utf-8' }
            )
          )

          await writePluginJson(
            distPluginJsonPath,
            JSON.stringify(
              distPluginJson(sourcePluginJson),
              undefined,
              2
            )
          )
        } else {
          logger.warn('plugin.json 不存在，打包后无法被uTools正常加载')
        }

        const distLogoPath = path.join(
          projectDistPath,
          logoBasename
        )

        await fs.copyFile(
          sourceDirLogoPath,
          distLogoPath
        )

        const codeFiles = await scanAllCodeFiles()

        if (codeFiles.length > 0) {
          await buildCodeClient(isDev, projectDistPath, ...codeFiles)
        }

        const cjsPackageJson = await safeCjsPackageJsonBuild(projectDistPath)

        if (options?.build?.syncNpmDeps && cjsPackageJson) {
          const dependencies = cjsPackageJson.dependencies
          if (Array.isArray(dependencies) && dependencies.length > 0) {
            logger.warn(`需要对npm依赖进行同步，需要同步插件${dependencies.length}个`)
            const npmExe = process.platform === 'win32'
              ? 'npm.cmd'
              : 'npm'
            cp.spawnSync(npmExe, ['install'], {
              cwd: projectDistPath,
              stdio: 'inherit'
            })
          }
        }

      }
    },
  }
}
