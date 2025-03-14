# 使用Rollup打包浏览器扩展

这个配置使用Rollup来打包浏览器扩展，支持TypeScript、React和CSS模块，并输出适合作为浏览器扩展加载的文件结构。

## 项目结构

```
src/
├── assets/          # 静态资源文件
├── background/      # 扩展的背景脚本
│   └── index.ts    
├── content/         # 内容脚本
│   └── index.ts
├── popup/           # 弹出窗口
│   ├── index.html
│   ├── index.tsx    # 弹出窗口入口
│   └── index.css    # 弹出窗口样式
└── manifest.json    # 扩展清单文件
```

## 安装依赖

使用pnpm安装Rollup和相关插件：

```bash
pnpm add -D rollup @rollup/plugin-typescript @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-replace @rollup/plugin-terser rollup-plugin-copy rollup-plugin-postcss
```

## 配置说明

### rollup.config.js

这个配置文件设置了如何打包扩展的三个主要部分：

1. **popup** - 扩展的弹出窗口界面
2. **content** - 注入到页面的内容脚本
3. **background** - 在扩展后台运行的脚本

配置文件处理了HTML文件的复制和修改，确保引用的脚本和样式正确链接。

### package.json 脚本

在package.json中添加以下脚本：

```json
"scripts": {
  "dev": "rollup -c -w --environment NODE_ENV:development",
  "build": "rollup -c --environment NODE_ENV:production",
  "build:extension": "node scripts/build.js",
  "clean": "rm -rf dist"
}
```

### 开发和构建

开发模式（实时监听文件变化）：
```bash
pnpm dev
```

生产构建：
```bash
pnpm build:extension
```

清理构建文件：
```bash
pnpm clean
```

## 注意事项

1. 在项目的`package.json`中设置了`"type": "module"`以支持ES模块。

2. 对于使用CommonJS的配置文件(如postcss.config.js和tailwind.config.js)，需要将它们重命名为`.cjs`后缀。

3. 构建后的文件位于`dist/`目录，可以直接加载到Chrome扩展中进行测试。

## 优点

与Vite相比，Rollup配置对于浏览器扩展有以下优势：

1. **更直接的输出控制**：可以精确控制输出的文件结构和格式。

2. **更简单的配置**：对于扩展这样的特定用例，配置更加简洁明确。

3. **更小的构建体积**：Rollup专注于ES模块，通常可以生成更小的输出。

4. **更可预测的构建结果**：输出结构与配置直接对应，便于调试和理解。

5. **更好的兼容性**：对浏览器扩展的特定需求提供了更好的支持，如处理manifest.json和各种脚本类型。 