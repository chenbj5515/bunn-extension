import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Cookies from 'js-cookie';

// 获取cookie中的语言
function getLanguageFromCookie() {
  const locale = Cookies.get('NEXT_LOCALE');
  return locale || 'zh'; // 默认中文
}

// 直接导入语言包
import zhTranslation from '../../messages/zh.json';
import enTranslation from '../../messages/en.json';
import zhTWTranslation from '../../messages/zh-TW.json';

// 初始化i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: zhTranslation
      },
      en: {
        translation: enTranslation
      },
      'zh-TW': {
        translation: zhTWTranslation
      }
    },
    lng: getLanguageFromCookie(),
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false  // 避免使用Suspense导致的问题
    }
  });

// 导出获取当前语言的函数
export const getCurrentLanguage = () => {
  return i18n.language;
};

// 导出语言切换函数
export const changeLanguage = (lang: string) => {
  // 更新i18n实例的语言
  i18n.changeLanguage(lang);
  
  // 设置cookie
  Cookies.set('NEXT_LOCALE', lang, {
    path: '/',
    expires: 365, // 一年有效期
    sameSite: 'lax'
  });
};

export default i18n;
