import { build } from 'tsup'

export function buildCode(dev: boolean, outDir: string, noExternal: (string | RegExp)[], nodeVersion: number, ...entries: string[]) {
  return build({
    dts: false,
    watch: false,
    entry: entries,
    outDir,
    sourcemap: dev,
    clean: false,
    format: 'cjs',
    noExternal,
    bundle: true,
    minify: false,
    target: `node${nodeVersion ?? 14}`,
    platform: 'node',
    outExtension() {
      return {
        js: '.js'
      }
    },
  })
}
