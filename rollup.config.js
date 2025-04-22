import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import autoprefixer from 'autoprefixer';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from 'tailwindcss';
import path from 'path';
import { fileURLToPath } from 'url';
// import alias from '@rollup/plugin-alias';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 环境变量处理
const production = process.env.NODE_ENV === 'production';
const isDev = !production;
const target = process.env.TARGET; // 可能的值: popup, content, background

// 根据环境变量设置API基础URL
const apiBaseUrl = production
  ? 'https://bunn.ink'
  : 'http://localhost:3000';

// 从.env文件加载环境变量
function loadEnv() {
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    return env;
  } catch (err) {
    console.warn('无法读取.env文件，使用默认环境变量');
    return {};
  }
}

const env = loadEnv();

// 共享配置
const commonPlugins = [
  json(),
  nodeResolve({
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    browser: true,
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: !production,
  }),
  babel({
    babelHelpers: 'bundled',
    presets: [
      '@babel/preset-env',
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]
    ],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    'process.env.API_BASE_URL': JSON.stringify(apiBaseUrl),
    'process.env.PUBLIC_SUBSCRIPTION_KEY': JSON.stringify(env.PUBLIC_SUBSCRIPTION_KEY?.replace(/"/g, '') || ''),
    'process.env.PUBLIC_REGION': JSON.stringify(env.PUBLIC_REGION?.replace(/"/g, '') || '')
  }),
  postcss({
    config: {
      path: './postcss.config.mjs',
    },
    plugins: [
      tailwindcss('./tailwind.config.ts'),
      autoprefixer(),
    ],
    extract: path.resolve('dist/popup.css'),
    minimize: production,
  }),
  production && terser(),
];

// 在构建开始前准备HTML文件
function prepareHtml() {
  return {
    name: 'prepare-html',
    buildStart() {
      try {
        console.log('开始准备HTML文件...');
        // 确保dist目录存在
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        
        // 读取原始HTML
        const htmlContent = fs.readFileSync(path.resolve(__dirname, 'src/popup/index.html'), 'utf-8');
        
        // 替换脚本标签
        const modifiedHtml = htmlContent.replace(
          '<script type="module" src="./index.tsx"></script>',
          '<script src="./popup.js"></script>\n  <link rel="stylesheet" href="./popup.css">'
        );
        
        // 写入到dist目录
        fs.writeFileSync(path.resolve(__dirname, 'dist/popup.html'), modifiedHtml);
        console.log('HTML文件准备完成');
      } catch (error) {
        console.error('准备HTML文件时出错:', error);
      }
    }
  };
}

// 复制静态文件
const copyPlugin = copy({
  targets: [
    { 
      src: 'src/manifest.json', 
      dest: 'dist',
      transform: (contents) => contents.toString().trim() // 移除可能的尾随字符
    },
    { src: 'src/assets/**/*', dest: 'dist/assets' },
  ],
  verbose: true,
});

// 配置
const configs = {
  // 弹出窗口
  popup: {
    input: 'src/popup/index.tsx',
    output: {
      file: 'dist/popup.js',
      format: 'iife',
      sourcemap: !production,
    },
    plugins: [
      ...commonPlugins,
      copyPlugin,
      prepareHtml(),
    ],
  },
  // 内容脚本
  content: {
    input: 'src/content/index.ts',
    output: {
      file: 'dist/content.js',
      format: 'iife',
      sourcemap: !production,
    },
    plugins: [
      ...commonPlugins,
    ],
  },
  // 后台脚本
  background: {
    input: 'src/background/index.ts',
    output: {
      file: 'dist/background.js',
      format: 'esm',
      sourcemap: !production,
    },
    plugins: [
      ...commonPlugins,
    ],
  },
};

// 根据TARGET环境变量决定构建哪些部分
export default target ? [configs[target]] : Object.values(configs);
