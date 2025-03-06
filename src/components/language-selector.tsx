import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, ChevronDown } from "lucide-react"

const languages = [
    { value: "zh", label: "Chinese" },
    { value: "en", label: "English" },
]

export function LanguageSelector() {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [selectedLanguage, setSelectedLanguage] = React.useState("zh")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)

    // 处理点击外部关闭
    const handleClickOutside = React.useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false)
            setIsExpanded(false)
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
        setIsMenuOpen(false)
        // 选择后延迟关闭，让用户看到选择结果
        setTimeout(() => setIsExpanded(false), 300)
    }

    // 处理点击展开/收起
    const handleToggle = () => {
        if (!isExpanded) {
            setIsExpanded(true)
            // 展开后稍微延迟打开菜单
            setTimeout(() => setIsMenuOpen(true), 100)
        } else {
            setIsMenuOpen(false)
            // 先关闭菜单，再收起
            setTimeout(() => setIsExpanded(false), 300)
        }
    }

    return (
        <div ref={containerRef} className="flex items-center justify-end">
            <motion.div
                className="relative"
                animate={{
                    width: isExpanded ? 160 : 40,
                }}
                transition={{
                    duration: isExpanded ? 0.5 : 0.65, // 收起动画稍微慢一点
                    ease: [0.16, 1, 0.3, 1], // 使用自定义缓动函数，更加丝滑
                }}
            >
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute right-0 top-0 h-10 w-full rounded-full border border-black bg-white overflow-hidden flex items-center z-10"
                        >
                            <div className="flex items-center w-full pl-4 pr-12">
                                <Globe className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="whitespace-nowrap overflow-visible">
                                    {languages.find((lang) => lang.value === selectedLanguage)?.label}
                                </span>
                                <ChevronDown
                                    className={`ml-auto mr-12 h-4 w-4 transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsMenuOpen(!isMenuOpen)
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    className="absolute right-0 h-10 w-10 rounded-full flex items-center justify-center z-10"
                    onClick={handleToggle}
                >
                    <Globe className="h-5 w-5 text-black" />
                </motion.button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-12 right-0 w-40 border-black bg-white rounded-md border z-20"
                        >
                            <div className="py-1">
                                {languages.map((language) => (
                                    <button
                                        key={language.value}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedLanguage === language.value ? "font-medium text-primary" : "text-gray-700"
                                            }`}
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

