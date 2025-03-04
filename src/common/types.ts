// 共享类型定义
export interface ApiConfig {
  apiKey: string;
  endpoint: string;
}

export interface SubtitleData {
  text: string;
  timestamp: number;
}

export interface TranslationResult {
  original: string;
  translated: string;
}

export interface TranslationMapValue {
  originalText: string;
  translationText: string;
}

export interface InsertPosition {
  parentNode: {
      insertBefore: (node: Node, reference: Node | null) => void;
  };
  nextSibling: Node | null;
}

export interface SpeakOptions {
  lang: string;
  rate: number;
} 