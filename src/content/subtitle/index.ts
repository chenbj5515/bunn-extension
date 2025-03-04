// 字幕功能
import { sendMessage } from '../../common/utils';
import type { SubtitleData } from '../../common/types';

const extractSubtitles = () => {
  // 提取字幕的逻辑
  console.log('Extracting subtitles');
};

// 检测是否在YouTube或Netflix页面
const isVideoSite = () => {
  return window.location.hostname.includes('youtube.com') || 
         window.location.hostname.includes('netflix.com');
};

// 初始化
if (isVideoSite()) {
  console.log('Subtitle extraction module loaded');
  // 初始化字幕提取
  extractSubtitles();
}

// Hello World 