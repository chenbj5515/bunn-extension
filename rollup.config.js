import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import fs from 'fs';
import path from 'path';

// 环境变量处理
const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;
const target = process.env.TARGET; // 可能的值: popup, content, background

// 根据环境变量设置API基础URL
const apiBaseUrl = isProd
  ? 'https://bunn-backend.vercel.app'
  : 'http://localhost:3000';

// 从.env文件加载环境变量
function loadEnv() {
  try {
    const envFile = fs.readFileSync('.env', 'utf-8');
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

// 通用插件配置
const commonPlugins = [
  resolve({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    browser: true
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: isDev
  }),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.API_BASE_URL': JSON.stringify(apiBaseUrl),
    'process.env.PUBLIC_SUBSCRIPTION_KEY': JSON.stringify(env.PUBLIC_SUBSCRIPTION_KEY?.replace(/"/g, '') || ''),
    'process.env.PUBLIC_REGION': JSON.stringify(env.PUBLIC_REGION?.replace(/"/g, '') || '')
  }),
  postcss({
    extensions: ['.css'],
    minimize: isProd,
    extract: true
  }),
  isProd && terser()
];

// 在构建开始前准备HTML文件
function prepareHtml() {
  return {
    name: 'prepare-html',
    buildStart() {
      // 确保dist目录存在
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
      }
      
      // 复制HTML文件并修改内容
      const htmlContent = fs.readFileSync('src/popup/index.html', 'utf-8');
      const modifiedHtml = htmlContent.replace(
        '<script type="module" src="./index.tsx"></script>',
        '<script type="module" src="./popup.js"></script>\n<link rel="stylesheet" href="./popup.css">'
      );
      
      fs.writeFileSync('dist/popup.html', modifiedHtml);
      
      // 复制manifest和assets
      fs.copyFileSync('src/manifest.json', 'dist/manifest.json');
      
      // 复制assets目录
      if (fs.existsSync('src/assets')) {
        if (!fs.existsSync('dist/assets')) {
          fs.mkdirSync('dist/assets', { recursive: true });
        }
        
        const assetFiles = fs.readdirSync('src/assets');
        assetFiles.forEach(file => {
          fs.copyFileSync(`src/assets/${file}`, `dist/assets/${file}`);
        });
      }
    }
  };
}

// 配置选项
const configs = {
  popup: {
    input: 'src/popup/index.tsx',
    output: {
      file: 'dist/popup.js',
      format: 'es',
      sourcemap: isDev
    },
    plugins: [
      prepareHtml(),
      ...commonPlugins
    ]
  },
  
  content: {
    input: 'src/content/index.ts',
    output: {
      file: 'dist/content.js',
      format: 'es',
      sourcemap: isDev
    },
    plugins: commonPlugins
  },
  
  background: {
    input: 'src/background/index.ts',
    output: {
      file: 'dist/background.js',
      format: 'es',
      sourcemap: isDev
    },
    plugins: commonPlugins
  }
};

// 根据TARGET环境变量决定构建哪些部分
export default target ? [configs[target]] : Object.values(configs); 