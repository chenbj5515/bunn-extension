// 从cookie中获取locale
export function getLocaleFromCookie(): string {
  const cookies = document.cookie.split(';');
  let locale = 'en'; // 默认英语
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'locale') {
      locale = value;
      break;
    }
  }
  
  // 支持的语言列表，如果不在支持列表中，则使用默认值
  const supportedLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'];
  if (!supportedLocales.includes(locale)) {
    locale = 'en';
  }
  
  return locale;
}

// 通知文案
type NotificationTranslations = {
  [key: string]: {
    [locale: string]: string;
  };
};

export const notificationMessages: NotificationTranslations = {
  // YouTube字幕捕获相关
  'processing.request': {
    'en': 'A request is already in progress',
    'zh': '正在处理请求中，请稍候',
    'ja': 'リクエストを処理中です。しばらくお待ちください',
    'ko': '요청이 이미 처리 중입니다',
    'es': 'Una solicitud ya está en curso',
    'fr': 'Une demande est déjà en cours de traitement',
    'de': 'Eine Anfrage ist bereits in Bearbeitung'
  },
  'video.not.found': {
    'en': 'Video element not found',
    'zh': '找不到视频元素',
    'ja': '動画要素が見つかりません',
    'ko': '비디오 요소를 찾을 수 없습니다',
    'es': 'Elemento de vídeo no encontrado',
    'fr': 'Élément vidéo introuvable',
    'de': 'Videoelement nicht gefunden'
  },
  'recognizing.subtitles': {
    'en': 'Reading current subtitles...',
    'zh': '正在识别字幕...',
    'ja': '字幕を認識中...',
    'ko': '자막을 인식 중...',
    'es': 'Reconociendo subtítulos...',
    'fr': 'Reconnaissance des sous-titres...',
    'de': 'Untertitel werden erkannt...'
  },
  'subtitle.copied': {
    'en': 'Subtitle data copied to clipboard',
    'zh': '字幕数据已复制到剪贴板',
    'ja': '字幕データをクリップボードにコピーしました',
    'ko': '자막 데이터가 클립보드에 복사되었습니다',
    'es': 'Datos de subtítulos copiados al portapapeles',
    'fr': 'Données de sous-titres copiées dans le presse-papiers',
    'de': 'Untertiteldaten wurden in die Zwischenablage kopiert'
  },
  'subtitle.recognition.failed': {
    'en': 'Failed to recognize subtitles',
    'zh': '无法识别字幕',
    'ja': '字幕を認識できませんでした',
    'ko': '자막을 인식하지 못했습니다',
    'es': 'No se pudieron reconocer los subtítulos',
    'fr': 'Échec de la reconnaissance des sous-titres',
    'de': 'Untertitel konnten nicht erkannt werden'
  },
  'subtitle.extraction.failed': {
    'en': 'Subtitle extraction failed',
    'zh': '字幕提取失败',
    'ja': '字幕の抽出に失敗しました',
    'ko': '자막 추출에 실패했습니다',
    'es': 'La extracción de subtítulos falló',
    'fr': 'L\'extraction des sous-titres a échoué',
    'de': 'Untertitelextraktion fehlgeschlagen'
  },
  'token.limit.reached': {
    'en': 'Token limit reached. Upgrade to unlock more tokens.',
    'zh': '您已达到token限制，升级后解锁更多token。',
    'ja': 'トークン制限に達しました。アップグレードして更多くのトークンをアンロックしてください。',
    'ko': '토큰 제한에 도달했습니다. 업그레이드하여 더 많은 토큰을 이용하세요.',
    'es': 'Límite de tokens alcanzado. Actualice para desbloquear más tokens.',
    'fr': 'Limite de jetons atteinte. Mettez à niveau pour débloquer plus de jetons.',
    'de': 'Token-Limit erreicht. Upgrade für mehr Tokens freischalten.'
  },
  'image.creation.failed': {
    'en': 'Failed to create image',
    'zh': '无法创建图像',
    'ja': '画像を作成できませんでした',
    'ko': '이미지를 생성하지 못했습니다',
    'es': 'No se pudo crear la imagen',
    'fr': 'Échec de la création de l\'image',
    'de': 'Bild konnte nicht erstellt werden'
  },
  'processing.failed': {
    'en': 'Processing failed',
    'zh': '处理失败',
    'ja': '処理に失敗しました',
    'ko': '처리에 실패했습니다',
    'es': 'Procesamiento fallido',
    'fr': 'Traitement échoué',
    'de': 'Verarbeitung fehlgeschlagen'
  },
  'screenshot.failed': {
    'en': 'Screenshot failed',
    'zh': '截图失败',
    'ja': 'スクリーンショットに失敗しました',
    'ko': '스크린샷 실패',
    'es': 'Captura de pantalla fallida',
    'fr': 'Échec de la capture d\'écran',
    'de': 'Screenshot fehlgeschlagen'
  },
  
  // Netflix字幕相关
  'no.subtitle.available': {
    'en': 'No subtitle available to copy',
    'zh': '没有可复制的字幕',
    'ja': 'コピーできる字幕がありません',
    'ko': '복사할 자막이 없습니다',
    'es': 'No hay subtítulos disponibles para copiar',
    'fr': 'Aucun sous-titre disponible à copier',
    'de': 'Keine Untertitel zum Kopieren verfügbar'
  },
  'preparing.subtitle.data': {
    'en': 'Preparing subtitle data...',
    'zh': '正在准备字幕数据...',
    'ja': '字幕データを準備中...',
    'ko': '자막 데이터 준비 중...',
    'es': 'Preparando datos de subtítulos...',
    'fr': 'Préparation des données de sous-titres...',
    'de': 'Untertiteldaten werden vorbereitet...'
  },
  'subtitle.copy.success': {
    'en': 'Subtitle copied successfully!',
    'zh': '字幕复制成功！',
    'ja': '字幕が正常にコピーされました！',
    'ko': '자막이 성공적으로 복사되었습니다!',
    'es': '¡Subtítulo copiado con éxito!',
    'fr': 'Sous-titre copié avec succès!',
    'de': 'Untertitel erfolgreich kopiert!'
  },
  'subtitle.copy.failed': {
    'en': 'Failed to copy subtitle',
    'zh': '字幕复制失败',
    'ja': '字幕のコピーに失敗しました',
    'ko': '자막 복사에 실패했습니다',
    'es': 'No se pudo copiar el subtítulo',
    'fr': 'Échec de la copie du sous-titre',
    'de': 'Kopieren des Untertitels fehlgeschlagen'
  },
  
  // 视频时间调整相关
  'video.time.adjusted.last': {
    'en': 'Video time adjusted to last copied time: {0} seconds',
    'zh': '视频时间已调整至上次复制位置: {0} 秒',
    'ja': '動画の時間を最後にコピーした時間に調整しました: {0} 秒',
    'ko': '비디오 시간이 마지막으로 복사된 시간으로 조정되었습니다: {0}초',
    'es': 'Tiempo de vídeo ajustado al último tiempo copiado: {0} segundos',
    'fr': 'Temps vidéo ajusté au dernier temps copié: {0} secondes',
    'de': 'Videozeit wurde auf die zuletzt kopierte Zeit eingestellt: {0} Sekunden'
  },
  'video.time.adjusted': {
    'en': 'Video time adjusted to: {0} seconds',
    'zh': '视频时间已调整至: {0} 秒',
    'ja': '動画の時間を調整しました: {0} 秒',
    'ko': '비디오 시간이 조정되었습니다: {0}초',
    'es': 'Tiempo de vídeo ajustado a: {0} segundos',
    'fr': 'Temps vidéo ajusté à: {0} secondes',
    'de': 'Videozeit angepasst auf: {0} Sekunden'
  },
  'no.time.parameter': {
    'en': 'No time parameter found in URL',
    'zh': 'URL中未找到时间参数',
    'ja': 'URLに時間パラメータが見つかりません',
    'ko': 'URL에서 시간 매개변수를 찾을 수 없습니다',
    'es': 'No se encontró ningún parámetro de tiempo en la URL',
    'fr': 'Aucun paramètre de temps trouvé dans l\'URL',
    'de': 'Kein Zeitparameter in URL gefunden'
  },
  'upgrade.button': {
    'en': 'Upgrade',
    'zh': '升级',
    'ja': 'アップグレード',
    'ko': '업그레이드',
    'es': 'Actualizar',
    'fr': 'Améliorer',
    'de': 'Upgrade'
  }
};

// 获取翻译文本，支持参数替换
export function getTranslation(key: string, locale?: string, ...args: any[]): string {
  // 获取locale，如果没有提供则从cookie中获取
  const currentLocale = locale || getLocaleFromCookie();
  
  // 获取翻译文本
  const translations = notificationMessages[key];
  if (!translations) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  
  let message = translations[currentLocale] || translations['en']; // 如果没有对应语言，使用英语
  
  // 替换参数 {0}, {1}, ...
  if (args.length > 0) {
    args.forEach((arg, index) => {
      message = message.replace(`{${index}}`, String(arg));
    });
  }
  
  return message;
} 