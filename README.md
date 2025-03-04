# Bunn Plugin

一个浏览器插件，用于字幕提取和文本翻译。

## 功能

1. **字幕提取**：在YouTube和Netflix等视频网站上提取字幕。
2. **文本翻译**：在任何网页上选中文本后按下"t"键进行翻译。
3. **单词查询**：选中单词或短语后显示悬浮窗，展示其在句子中的意思。

## 项目结构

```
root/
├── src/
│   ├── common/             # 共享代码
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── content/            # 内容脚本
│   │   ├── subtitle/       # 字幕功能
│   │   │   └── index.ts
│   │   └── translation/    # 翻译功能
│   │       └── index.ts
│   ├── popup/              # 弹出窗口
│   │   └── index.tsx
│   ├── background/         # 后台脚本
│   │   └── index.ts
│   └── manifest.json
├── dist/                   # 构建输出
└── package.json            # 单一 package.json
```

## 开发

1. 安装依赖：
```
npm install
```

2. 开发模式：
```
npm run dev
```

3. 构建插件：
```
npm run build
```

4. 加载插件：
   - 打开Chrome浏览器，进入扩展程序页面（chrome://extensions/）
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"，选择项目的`dist`目录

## 配置

在插件弹出窗口中设置API密钥和端点。 