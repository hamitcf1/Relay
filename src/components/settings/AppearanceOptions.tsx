import { motion } from 'framer-motion'
import { Sun, Moon, Palette } from 'lucide-react'
import { useThemeStore, ACCENT_COLORS } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

export function AppearanceOptions() {
    const { theme, setTheme, accentColor, setAccentColor } = useThemeStore()

    return (
        <div className="space-y-6 p-1">
            {/* Theme Toggle */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2">
                    Visual Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setTheme('light')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all duration-200",
                            theme === 'light'
                                ? "bg-white border-primary text-primary shadow-sm"
                                : "bg-zinc-100/50 dark:bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                    >
                        <Sun className="w-4 h-4" />
                        <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all duration-200",
                            theme === 'dark'
                                ? "bg-zinc-900 border-primary text-primary shadow-sm"
                                : "bg-zinc-100/50 dark:bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                    >
                        <Moon className="w-4 h-4" />
                        <span className="text-sm font-medium">Dark</span>
                    </button>
                </div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Accent Color
                    </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {ACCENT_COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setAccentColor(color.value)}
                            className={cn(
                                "relative group flex items-center gap-2 p-2 rounded-xl border transition-all duration-200",
                                accentColor === color.value
                                    ? "bg-zinc-100 dark:bg-zinc-900 border-primary/50"
                                    : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <div
                                className="w-4 h-4 rounded-full shadow-inner"
                                style={{ backgroundColor: `hsl(${color.value})` }}
                            />
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {color.name}
                            </span>
                            {accentColor === color.value && (
                                <motion.div
                                    layoutId="active-accent"
                                    className="absolute inset-0 border border-primary rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
