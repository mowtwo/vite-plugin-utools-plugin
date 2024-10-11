import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => {
  return {
    entry: [
      "./src/index.ts"
    ],
    outDir: "dist",
    format: ['esm'],
    dts: true,
    clean: true,
    skipNodeModulesBundle: true,
    bundle: true,
    tsconfig: "./tsconfig.json",
    minify: !Boolean(watch),
    sourcemap: Boolean(watch),
  }
})
