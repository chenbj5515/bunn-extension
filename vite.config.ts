import { defineConfig } from 'vite';
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
      console.log('Manifest.json已复制到dist目录');
      
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
        console.log('Popup HTML已移动到dist/popup.html并修正资源路径');
        
        // 删除原始文件夹
        fs.rmSync('dist/src', { recursive: true, force: true });
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // 根据命令确定当前环境
  const isProduction = command === 'build';
  
  // 设置环境变量
  const apiBaseUrl = isProduction 
    ? 'https://japanese-memory-auth.chenbj55150220.workers.dev'
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
          subtitle: path.resolve(__dirname, 'src/content/subtitle/index.ts'),
          translation: path.resolve(__dirname, 'src/content/translation/index.ts'),
          background: path.resolve(__dirname, 'src/background/index.ts'),
        },
        output: {
          // 所有文件直接输出到根目录
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash].[ext]',
          manualChunks: undefined,
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
      'import.meta.env.VITE_PUBLIC_SUBSCRIPTION_KEY': JSON.stringify("c61f77c2d4de4872af6c0bb6f92e2dcb"),
      'import.meta.env.VITE_PUBLIC_REGION': JSON.stringify("eastasia"),
    }
  };
}); 