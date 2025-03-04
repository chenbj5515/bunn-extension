// 初始化样式
export function initializeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .translation-paragraph {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        .translation-paragraph.light-theme {
            color: #666;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            margin-bottom: 10px;
        }
        .translation-paragraph.dark-theme {
            color: inherit;
            border: 1px solid #444;
            background-color: #2d2d2d;
            margin-bottom: 10px;
        }
        .play-icon {
            display: inline-flex;
            align-items: center;
        }
        .play-icon svg {
            width: 16px;
            height: 16px;
            margin-left: 4px;
        }
        .selected-text {
            margin-top: 10px;
        }
        
        /* 弹窗样式 */
        .comfy-trans-popup {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            transition: all 0.3s ease;
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
            border-radius: 10px;
            z-index: 10000;
            max-width: 350px;
            min-width: 200px;
            overflow: visible;
            font-size: 14px;
            line-height: 1.9;
        }
        .comfy-trans-popup.light-theme {
            color: #333;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
        }
        .comfy-trans-popup.dark-theme {
            color: #f0f0f0;
            background-color: #2d2d2d;
            border: 1px solid #444;
        }
        .comfy-trans-close {
            opacity: 0.7;
            transition: opacity 0.2s ease;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        .comfy-trans-close:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.1);
        }
        .comfy-trans-loading {
            text-align: center;
            padding: 15px;
            color: #888;
            font-style: italic;
        }
        .comfy-trans-original {
            font-size: 14px;
            word-break: break-word;
            white-space: normal;
            line-height: 1.9;
        }
        .comfy-trans-translation {
            margin-bottom: 15px;
            font-size: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            word-break: break-word;
            white-space: normal;
            line-height: 1.9;
        }
        .comfy-trans-popup.dark-theme .comfy-trans-translation {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .comfy-trans-explanation {
            font-size: 14px;
            line-height: 1.9;
            color: #555;
            word-break: break-word;
            white-space: normal;
        }
        .comfy-trans-popup.dark-theme .comfy-trans-explanation {
            color: #bbb;
        }
        
        /* 播放按钮样式 */
        .comfy-trans-play {
            display: flex;
            align-items: center;
        }
        
        /* 悬浮提示样式 */
        .comfy-trans-tooltip {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            transition: opacity 0.3s ease;
            z-index: 10001;
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
            border-radius: 8px;
            padding: 12px;
            max-width: 300px;
            min-width: 150px;
            position: absolute;
            overflow: visible;
            font-size: 14px;
            line-height: 1.9;
        }
        .comfy-trans-tooltip.light-theme {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            color: #333;
        }
        .comfy-trans-tooltip.dark-theme {
            background-color: #2d2d2d;
            border: 1px solid #444;
            color: #f0f0f0;
        }
        .comfy-trans-underlined {
            transition: all 0.2s ease;
            border-radius: 3px;
            padding: 0 2px;
            position: relative;
        }
        .comfy-trans-underlined:hover {
            background-color: rgba(52, 152, 219, 0.2) !important;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
        
        /* 确保内容不会被截断 */
        .comfy-trans-popup *, .comfy-trans-tooltip * {
            word-break: break-word;
            white-space: normal;
            overflow: visible;
            font-size: 14px;
            line-height: 1.9;
        }
    `;
    document.head.appendChild(style);
}
