import path from 'node:path'
import { build } from 'tsup'

export async function buildCode(dev: boolean, outDir: string, noExternal: (string | RegExp)[], nodeVersion: number, ...entries: string[]) {
  const parsedEnteries = entries.map(
    entry => {
      const [
        , ...rest
      ] = entry.split('/')

      if (rest.length === 1) {
        return {
          outDir,
          entry
        }
      }

      const relative = rest.slice(0, rest.length - 1)

      return {
        entry,
        outDir: path.join(outDir, ...relative)
      }
    }
  ).reduce((map, entryGroup) => {
    if (map.has(entryGroup.outDir)) {
      const group = map.get(entryGroup.outDir)!
      group?.push(entryGroup.entry)
      map.set(entryGroup.outDir, group)
    } else {
      map.set(
        entryGroup.outDir,
        [entryGroup.entry]
      )
    }
    return map
  }, new Map<string, string[]>())

  for (const [outDir, entries] of parsedEnteries.entries()) {
    await build({
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
}
