import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// 文档链接:
// Vite v5: https://vitejs.dev/guide/
// Chrome扩展: https://developer.chrome.com/docs/extensions/

// 自定义插件：复制manifest.json到dist目录并处理HTML输出
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-plugin',
    closeBundle() {
      // 确保dist目录存在
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
      }
      
      // 复制manifest.json
      fs.copyFileSync('src/manifest.json', 'dist/manifest.json');
      
      // 确保assets目录存在
      if (!fs.existsSync('dist/assets')) {
        fs.mkdirSync('dist/assets', { recursive: true });
      }
      
      // 复制assets目录中的文件
      if (fs.existsSync('src/assets')) {
        const files = fs.readdirSync('src/assets');
        files.forEach(file => {
          fs.copyFileSync(`src/assets/${file}`, `dist/assets/${file}`);
        });
      }
      
      // 处理popup.html
      const srcPopupPath = 'dist/src/popup/index.html';
      const destPopupPath = 'dist/popup.html';
      
      if (fs.existsSync(srcPopupPath)) {
        // 读取HTML内容
        let htmlContent = fs.readFileSync(srcPopupPath, 'utf8');
        
        // 修正资源路径，所有资源都在根目录
        htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./');
        htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./');
        
        // 写入到目标位置
        fs.writeFileSync(destPopupPath, htmlContent);
        
        // 删除原始文件夹
        fs.rmSync('dist/src', { recursive: true, force: true });
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  
  // 根据 mode 参数确定当前环境
  const isProduction = mode === 'production';
  
  // 设置环境变量
  const apiBaseUrl = isProduction 
    ? 'https://bunn-backend.vercel.app'
    : 'http://localhost:3000';
  
  return {
    plugins: [
      react(),
      chromeExtensionPlugin(),
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: path.resolve(__dirname, 'src/popup/index.html'),
          content: path.resolve(__dirname, 'src/content/index.ts'),
          // subtitle: path.resolve(__dirname, 'src/content/subtitle/index.ts'),
          // translation: path.resolve(__dirname, 'src/content/translation/index.ts'),
          background: path.resolve(__dirname, 'src/background/index.ts'),
        },
        output: {
          // 所有文件直接输出到根目录
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash].[ext]',
        },
      },
      emptyOutDir: true,
    },
    // 添加开发服务器配置
    server: {
      watch: {
        // 监听文件变化
        usePolling: true,
      },
    },
    // 开发模式配置
    // 确保开发模式也输出到dist目录
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // 将API基础URL暴露给客户端代码
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_PUBLIC_SUBSCRIPTION_KEY': JSON.stringify(env.VITE_PUBLIC_SUBSCRIPTION_KEY),
      'import.meta.env.VITE_PUBLIC_REGION': JSON.stringify(env.VITE_PUBLIC_REGION),
    }
  };
}); 