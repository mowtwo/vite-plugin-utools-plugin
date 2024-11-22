import { relative } from 'path'
import { build } from 'tsup'
import { filePathExisted } from './fs'

export async function buildCode(dev: boolean, outDir: string, noExternal: (string | RegExp)[], nodeVersion: number, entryPath: string) {
  const outbase = `./${relative(process.cwd(), entryPath)}`

  await build({
    dts: false,
    watch: false,
    entry: [`${outbase}/**/*.{ts,js}`],
    outDir,
    sourcemap: dev,
    clean: false,
    format: 'cjs',
    noExternal,
    bundle: true,
    minify: false,
    target: `node${nodeVersion ?? 14}`,
    platform: 'node',
    splitting: true,
    outExtension() {
      return {
        js: '.js'
      }
    },
    external: [
      "electron",
      "./**/*.ts",
      "../**/*.ts"
    ],
    esbuildOptions(options) {
      options.outbase = outbase
    }
  })
}
