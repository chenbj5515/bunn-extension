"use client"
import * as React from "react"
import { Globe } from "lucide-react"
import Cookies from 'js-cookie';
import { changeLanguage, getCurrentLanguage } from "@/utils/i18n";

export function LanguageSelector() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [locale, setLocale] = React.useState(getCurrentLanguage() || 'zh'); // 使用getCurrentLanguage获取当前语言
    const containerRef = React.useRef<HTMLDivElement>(null)

    const handleLanguageChange = (value: string) => {
        setLocale(value); // 更新locale状态
        changeLanguage(value); // 使用i18n中定义的changeLanguage函数
        setIsOpen(false);
    }

    // 从i18n同步语言设置
    React.useEffect(() => {
        setLocale(getCurrentLanguage());
    }, []);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                className="flex items-center space-x-1 text-[14px] hover:text-gray-600"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Globe className="w-5 h-5" />
                <span>
                    {locale === 'zh' ? '简体中文' :
                        locale === 'zh-TW' ? '繁體中文' :
                            'English'}
                </span>
            </button>

            {isOpen && (
                <div className="right-0 absolute bg-white ring-opacity-5 shadow-lg mt-2 rounded-md ring-1 ring-black w-40">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'zh' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('zh')}
                        >
                            简体中文
                        </button>
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'zh-TW' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('zh-TW')}
                        >
                            繁體中文
                        </button>
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'en' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('en')}
                        >
                            English
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}