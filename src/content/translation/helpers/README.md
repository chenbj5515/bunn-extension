# 翻译扩展辅助函数说明

本目录包含了各种辅助函数，按照功能进行了分类整理。

## 文件结构

- `index.ts` - 导出所有辅助函数的入口文件
- `translationHelpers.ts` - 翻译相关的辅助函数
- `popupHelpers.ts` - 悬浮窗相关的辅助函数
- `domHelpers.ts` - DOM 操作相关的辅助函数
- `uiHelpers.ts` - UI 元素创建相关的辅助函数
- `utils.ts` - 通用工具函数

## 各模块主要功能

### translationHelpers.ts
处理翻译流程的核心函数，包括：
- `handlePlainTextTranslation` - 处理纯文本的翻译，使用流式 API
- `handleTranslationUpdate` - 处理翻译结果的更新
- `handleExplanationStream` - 处理解释内容的流式更新
- `shouldTranslateAsFullParagraph` - 判断是否应该按整段翻译

### popupHelpers.ts
处理弹窗的创建、显示和操作，包括：
- `createPopup` - 创建弹窗
- `showPopup` - 显示弹窗
- `handlePopupDisplay` - 处理弹窗显示的统一函数
- `calculateWidthFromCharCount` - 根据字符数计算适当的宽度

### domHelpers.ts
处理 DOM 操作，包括：
- `addUnderlineWithPopup` - 为选中文本添加下划线并关联弹窗
- `getTargetNode` - 获取目标节点
- `findInsertPosition` - 查找插入位置
- `findParagraphInsertPosition` - 找到段落的插入位置
- `addUnderlineToSelection` - 为选中文本添加下划线
- `isEntireParagraphSelected` - 判断是否选中了整个段落
- `getParagraphNode` - 根据鼠标位置获取最近的完整段落元素

### uiHelpers.ts
处理 UI 元素的创建，包括：
- `createTranslationDiv` - 创建翻译的 div 元素
- `createExplanationDiv` - 创建解释的 div 元素
- `createOriginalDiv` - 创建原文的 div 元素
- `createPlayButton` - 创建播放按钮
- `createTempContainer` - 创建临时容器
- `insertTempContainer` - 插入临时容器到 DOM
- `insertTranslatedParagraph` - 插入翻译段落
- `appendLexicalUnit` - 添加含义和音标到翻译中

### utils.ts
通用工具函数，包括：
- `copyToClipboard` - 将选中文本复制到剪贴板
- `highlightRestoredText` - 从 URL 恢复文本并高亮显示
- `handleHighlight` - 处理 URL 参数，包括滚动和文本高亮
- `removeYoutubeTranslateButton` - 移除 YouTube 评论区的翻译按钮 