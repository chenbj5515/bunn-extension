#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

// 创建目录（如果不存在）
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 清理目录
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(dir);
}

// 主构建函数
async function build() {
  try {
    const startTime = Date.now();
    log('🚀 开始构建浏览器扩展...', colors.bright + colors.blue);

    // 清理dist目录
    log('📁 清理dist目录...', colors.yellow);
    cleanDir('dist');

    // 执行rollup构建
    log('🔧 执行rollup构建...', colors.yellow);
    execSync('pnpm build', { stdio: 'inherit' });

    // 验证生成的文件
    log('✅ 验证生成的文件...', colors.yellow);
    const requiredFiles = ['popup.html', 'popup.js', 'content.js', 'background.js', 'manifest.json'];
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join('dist', file)));

    if (missingFiles.length > 0) {
      log(`❌ 构建失败：缺少以下文件: ${missingFiles.join(', ')}`, colors.bright + colors.red);
      process.exit(1);
    }

    // 计算构建时间
    const endTime = Date.now();
    const buildTime = ((endTime - startTime) / 1000).toFixed(2);

    log(`✨ 构建完成！耗时: ${buildTime}秒`, colors.bright + colors.green);
    log('📦 生成的文件位于 dist/ 目录下', colors.green);
    log('👉 您可以将dist目录加载到Chrome扩展中进行测试', colors.green);
  } catch (error) {
    log(`❌ 构建出错: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  }
}

// 执行构建
build(); 