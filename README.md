# 基于 vite 开发 uTools 插件时帮助插件

## 解决了什么问题

### 分离 preload 部分

目前 preload 部分使用的是 nodejs 的 api，完全独立于渲染进程，所以默认规范了 preload 以及 plugin.json 还有 logo 文件的位置

通过在插件函数设定参数来辅助扫描

```ts
import { defineConfig } from "vite";
import utools from "../dist/index";

export default defineConfig({
  plugins: [utools("public/logo.png", "src-utools")],
});
```

### uTools 不支持 esm

uTools 目前仅支持加载 cjs，当你使用 vite，并且在最外层的 package.json 设置`type`为`module`时，会导致调试的时候报错，因此会自动检测外层的 package.json 是否是 esm，如果是，则会在对应目录下创建一个 package.json 文件并设置`type`为`common`

### 支持 ts

内部调用了 tsup 帮助打包，并且支持配置实现不压缩，配置 noExternal 保证可以复制库代码
