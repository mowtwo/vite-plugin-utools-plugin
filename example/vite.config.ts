import { defineConfig } from "vite";
import utools from '../dist/index'

export default defineConfig({
  plugins: [
    utools(
      'public/logo.png',
      'src-utools'
    )
  ]
})
