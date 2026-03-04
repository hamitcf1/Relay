import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Palette, MousePointer2, Sparkles, Smile, User, Type } from 'lucide-react'
import { useThemeStore, ACCENT_COLORS } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getCursorEnabled, setCursorEnabled } from '@/components/ui/CustomCursor'
import { UserAvatar } from '@/components/ui/UserAvatar'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import { cn } from '@/lib/utils'

export function AppearanceOptions() {
    const { theme, setTheme, accentColor, setAccentColor } = useThemeStore()
    const { user, updateSettings } = useAuthStore()
    const { t } = useLanguageStore()
    const [cursorEnabled, setCursorEnabledLocal] = useState(getCursorEnabled)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const avatar_style = user?.settings?.avatar_style || 'initials'
    const avatar_emoji = user?.settings?.avatar_emoji || '😊'

    const toggleCursor = () => {
        const newVal = !cursorEnabled
        setCursorEnabledLocal(newVal)
        setCursorEnabled(newVal)
    }

    return (
        <div className="space-y-6 p-1">
            {/* Theme Toggle */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2">
                    Visual Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                        <span className="text-xs font-medium">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('comfort')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all duration-200",
                            theme === 'comfort'
                                ? "bg-zinc-800 border-primary text-primary shadow-sm"
                                : "bg-zinc-100/50 dark:bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium">Comfort</span>
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
                        <span className="text-xs font-medium">Dark</span>
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

            {/* Custom Cursor Toggle */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <MousePointer2 className="w-3.5 h-3.5 text-zinc-500" />
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Custom Cursor
                    </label>
                </div>
                <button
                    onClick={toggleCursor}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                        cursorEnabled
                            ? "bg-primary/10 border-primary/30 text-foreground"
                            : "bg-zinc-100/50 dark:bg-zinc-900 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                >
                    <span className="text-xs font-medium">
                        {cursorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <div
                        className={cn(
                            "w-8 h-4 rounded-full relative transition-colors duration-200",
                            cursorEnabled ? "bg-primary" : "bg-zinc-600"
                        )}
                    >
                        <motion.div
                            className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm"
                            animate={{ left: cursorEnabled ? 16 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </div>
                </button>
            </div>

            {/* Avatar Style Section */}
            <div className="space-y-4 border-t border-border/50 pt-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {t('appearance.avatar_style')}
                        </label>
                    </div>
                    <UserAvatar user={user} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'initials', icon: Type, label: t('appearance.avatar.initials') },
                        { id: 'name', icon: User, label: t('appearance.avatar.name') },
                        { id: 'emoji', icon: Smile, label: t('appearance.avatar.emoji') }
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => updateSettings({ avatar_style: style.id as any })}
                            className={cn(
                                "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200",
                                avatar_style === style.id
                                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                                    : "bg-zinc-100/50 dark:bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <style.icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">{style.label}</span>
                        </button>
                    ))}
                </div>

                {avatar_style === 'emoji' && (
                    <div className="space-y-3 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-primary/30 hover:bg-primary/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl leading-none">{avatar_emoji}</span>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {t('appearance.avatar.choose_emoji')}
                                </span>
                            </div>
                            <Smile className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {showEmojiPicker && (
                            <div className="relative z-50 mt-2">
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl -m-2 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
                                <div className="bg-card border border-border rounded-xl p-1 shadow-2xl overflow-hidden">
                                    <EmojiPicker
                                        theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                        onEmojiClick={(emojiData) => {
                                            updateSettings({ avatar_emoji: emojiData.emoji })
                                            setShowEmojiPicker(false)
                                        }}
                                        width="100%"
                                        height={350}
                                        lazyLoadEmojis={true}
                                        skinTonesDisabled={true}
                                        searchPlaceholder="Search emoji..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
