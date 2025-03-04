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
      console.log('Manifest.json has been copied to dist directory');
      
      // 检查并移动HTML文件
      const srcPopupPath = 'dist/src/popup/index.html';
      const destPopupPath = 'dist/popup.html';
      
      if (fs.existsSync(srcPopupPath)) {
        // 读取HTML内容
        let htmlContent = fs.readFileSync(srcPopupPath, 'utf8');
        
        // 修正资源路径，将/assets/改为./assets/
        htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./assets/');
        htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./assets/');
        
        // 写入到目标位置
        fs.writeFileSync(destPopupPath, htmlContent);
        console.log('Popup HTML has been moved to dist/popup.html with corrected asset paths');
        
        // 删除原始文件夹
        fs.rmSync('dist/src', { recursive: true, force: true });
        console.log('Cleaned up temporary src directory');
      }
      
      // 确保content目录存在
      if (!fs.existsSync('dist/content')) {
        fs.mkdirSync('dist/content', { recursive: true });
      }
      
      // 移动content子目录的文件
      try {
        // 检查subtitle.js是否存在
        if (fs.existsSync('dist/subtitle.js')) {
          fs.copyFileSync('dist/subtitle.js', 'dist/content/subtitle.js');
          fs.unlinkSync('dist/subtitle.js');
          console.log('Moved subtitle.js to content/subtitle.js');
        }
        
        // 检查translation.js是否存在
        if (fs.existsSync('dist/translation.js')) {
          fs.copyFileSync('dist/translation.js', 'dist/content/translation.js');
          fs.unlinkSync('dist/translation.js');
          console.log('Moved translation.js to content/translation.js');
        }
        
        // 移动popup.js到assets目录（如果它在根目录）
        if (fs.existsSync('dist/popup.js')) {
          // 确保assets目录存在
          if (!fs.existsSync('dist/assets')) {
            fs.mkdirSync('dist/assets', { recursive: true });
          }
          
          // 如果assets目录中已经有popup-hash.js文件，则不需要移动
          const assetFiles = fs.readdirSync('dist/assets');
          const popupAssetExists = assetFiles.some(file => file.startsWith('popup-') && file.endsWith('.js'));
          
          if (!popupAssetExists) {
            fs.copyFileSync('dist/popup.js', 'dist/assets/popup.js');
            fs.unlinkSync('dist/popup.js');
            console.log('Moved popup.js to assets directory');
          } else {
            fs.unlinkSync('dist/popup.js');
            console.log('Removed duplicate popup.js from root directory');
          }
        }
        
        // 删除content.js（如果存在）
        if (fs.existsSync('dist/content.js')) {
          fs.unlinkSync('dist/content.js');
          console.log('Removed content.js as requested');
        }
      } catch (error) {
        console.error('Error moving files:', error);
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
          entryFileNames: (chunkInfo) => {
            // 对于background入口，直接输出到根目录
            if (chunkInfo.name === 'background') {
              return '[name].js';
            }
            // 对于subtitle和translation，输出到根目录，后面会移动
            if (chunkInfo.name === 'subtitle' || chunkInfo.name === 'translation') {
              return '[name].js';
            }
            // 对于popup相关的JS，放在assets目录
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash].[ext]';
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            
            return 'assets/[name]-[hash].[ext]';
          },
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