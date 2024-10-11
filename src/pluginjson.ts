import path from "node:path";
import fs from 'node:fs/promises'

export function writePluginJson(
  filename: string,
  text: string
) {

  filename = filename.endsWith('plugin.json') ? filename : path.join(
    filename, 'plugin.json'
  )

  return fs.writeFile(filename, text, { encoding: 'utf-8' })
}

export function buildPluginJson(dev: false, logo: string, main: string): string
export function buildPluginJson(dev: true, logo: string, main: string, devServer: string, jsonSchemaPath: string): string
export function buildPluginJson(dev: boolean, logo: string, main: string, devServer?: string, jsonSchemaPath?: string): string {
  const baseJson = {
    logo,
    main,
    features: []
  }

  if (dev) {
    return JSON.stringify({
      ...baseJson,
      development: {
        main: `${devServer!}/${main}`
      },
      $schema: jsonSchemaPath!
    }, undefined, 2)
  }

  return JSON.stringify(baseJson, undefined, 2)
}

export function distPluginJson(json:Record<string,unknown>) {
  const cleanJson = {...json}
  delete cleanJson.$schema
  delete cleanJson.development
  return cleanJson
}
