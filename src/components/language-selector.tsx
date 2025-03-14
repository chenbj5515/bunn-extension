import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

const languages = [
    { value: "zh", label: "Chinese" },
    { value: "en", label: "English" },
]

export function LanguageSelector() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedLanguage, setSelectedLanguage] = React.useState("zh")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const { i18n } = useTranslation();

    // 处理点击外部关闭
    const handleClickOutside = React.useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }
    }, [])

    React.useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [handleClickOutside])

    // 处理语言选择
    const handleLanguageSelect = (value: string) => {
        setSelectedLanguage(value)
        // 导入 i18n 实例        
        // 切换语言
        i18n.changeLanguage(value);
        setIsOpen(false)
    }

    // 处理点击展开/收起
    const handleToggle = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div ref={containerRef} className="flex items-center justify-end">
            <motion.div
                className="relative"
                animate={{
                    width: isOpen ? 160 : 40,
                }}
                transition={{
                    duration: isOpen ? 0.5 : 0.65, // 收起动画稍微慢一点
                    ease: [0.16, 1, 0.3, 1], // 使用自定义缓动函数，更加丝滑
                }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute right-0 top-0 h-10 w-full rounded-[12px] border border-black bg-white overflow-hidden flex items-center z-10"
                        >
                            <div className="flex items-center w-full pl-4 pr-12">
                                <Globe className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="whitespace-nowrap overflow-visible">
                                    {languages.find((lang) => lang.value === selectedLanguage)?.label}
                                </span>
                                <ChevronDown
                                    className={`ml-auto mr-12 h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsOpen(!isOpen)
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    className="absolute right-0 h-10 w-10 rounded-[12px] flex items-center justify-center z-10"
                    onClick={handleToggle}
                >
                    <Globe className="h-5 w-5 text-black" />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-12 right-0 w-40 border-black bg-white rounded-[12px] border z-20"
                        >
                            <div className="py-1">
                                {languages.map((language) => (
                                    <button
                                        key={language.value}
                                        className={`w-full rounded-[6px] text-left px-4 py-2 hover:bg-gray-100 ${selectedLanguage === language.value ? "font-medium text-primary" : "text-gray-700"}`}
                                        onClick={() => handleLanguageSelect(language.value)}
                                    >
                                        {language.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

