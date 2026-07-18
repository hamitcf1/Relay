import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, BookOpen, Sparkles, Smile, User, Type, MoonStar } from 'lucide-react'
import { useThemeStore, ACCENT_COLORS, type Theme } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { UserAvatar } from '@/components/ui/UserAvatar'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import { cn } from '@/lib/utils'

interface ToggleProps {
    label: string
    value: boolean
    onChange: () => void
    description?: string
}

function Toggle({ label, value, onChange, description }: ToggleProps) {
    return (
        <button
            onClick={onChange}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/70 hover:border-border transition-colors text-left"
            aria-pressed={value}
        >
            <div className="min-w-0 pr-3">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {description && <span className="text-xs text-muted-foreground mt-0.5">{description}</span>}
            </div>
            <div
                className={cn(
                    "w-9 h-5 rounded-full relative transition-colors shrink-0",
                    value ? "bg-primary" : "bg-muted"
                )}
            >
                <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: value ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </button>
    )
}

export function AppearanceOptions() {
    const { theme, setTheme, accentColor, setAccentColor } = useThemeStore()
    const { user, updateSettings } = useAuthStore()
    const { t } = useLanguageStore()
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const avatar_style = user?.settings?.avatar_style || 'initials'
    const avatar_emoji = user?.settings?.avatar_emoji || '😊'
    const animationsEnabled = !user?.settings?.disable_animations

    const themes: { id: Theme; icon: typeof Sun; label: string }[] = [
        { id: 'light', icon: Sun, label: t('appearance.theme.light') },
        { id: 'sepia', icon: BookOpen, label: t('appearance.theme.sepia') },
        { id: 'comfort', icon: Sparkles, label: t('appearance.theme.comfort') },
        { id: 'dark', icon: Moon, label: t('appearance.theme.dark') },
        { id: 'midnight', icon: MoonStar, label: t('appearance.theme.midnight') },
    ]

    const accentLabels: Record<string, string> = {
        indigo: t('appearance.accent.indigo'),
        sky: t('appearance.accent.sky'),
        emerald: t('appearance.accent.emerald'),
        rose: t('appearance.accent.rose'),
        amber: t('appearance.accent.amber'),
        violet: t('appearance.accent.violet'),
    }

    const avatarStyles = [
        { id: 'initials' as const, icon: Type, label: t('appearance.avatar.initials') },
        { id: 'name' as const, icon: User, label: t('appearance.avatar.name') },
        { id: 'emoji' as const, icon: Smile, label: t('appearance.avatar.emoji') }
    ]

    return (
        <div className="space-y-5 p-1">
            {/* Theme */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {t('appearance.theme.title')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {themes.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setTheme(id)}
                            className={cn(
                                "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 transition-colors active:scale-[0.98]",
                                theme === id
                                    ? "bg-primary/10 border-primary/50 text-primary"
                                    : "bg-card/40 border-border/50 text-muted-foreground hover:bg-card/70 hover:text-foreground"
                            )}
                            aria-pressed={theme === id}
                        >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            <span className="max-w-full text-center text-xs font-medium leading-tight [overflow-wrap:anywhere]">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {t('appearance.accent.title')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {ACCENT_COLORS.map((color) => (
                        <button
                            key={color.key}
                            onClick={() => setAccentColor(color.value)}
                            className={cn(
                                "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors active:scale-[0.98]",
                                accentColor === color.value
                                    ? "bg-primary/10 border-primary/50 text-primary"
                                    : "bg-card/40 border-border/50 hover:bg-card/70"
                            )}
                            aria-pressed={accentColor === color.value}
                        >
                            <div
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: `hsl(${color.value})` }}
                                aria-hidden="true"
                            />
                            <span className={cn("min-w-0 truncate text-sm font-medium", accentColor === color.value ? "text-primary" : "text-foreground")}>
                                {accentLabels[color.key] || color.key}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Animations */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {t('appearance.animations.title')}
                </label>
                <Toggle
                    label={animationsEnabled ? t('common.enabled') : t('common.disabled')}
                    description={t('appearance.animations.desc')}
                    value={animationsEnabled}
                    onChange={() => updateSettings({ disable_animations: animationsEnabled })}
                />
            </div>

            {/* Avatar Style */}
            <div className="space-y-2 border-t border-border/50 pt-6">
                <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('appearance.avatar_style')}
                    </label>
                    <UserAvatar user={user} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {avatarStyles.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => updateSettings({ avatar_style: id })}
                            className={cn(
                                "flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors active:scale-[0.98]",
                                avatar_style === id
                                    ? "bg-primary/10 border-primary/50 text-primary"
                                    : "bg-card/40 border-border/50 text-muted-foreground hover:bg-card/70 hover:text-foreground"
                            )}
                            aria-pressed={avatar_style === id}
                        >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            <span className="min-w-0 text-center text-xs font-medium leading-tight [overflow-wrap:anywhere]">{label}</span>
                        </button>
                    ))}
                </div>

                {avatar_style === 'emoji' && (
                    <div className="space-y-2 pt-2">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-full flex items-center justify-between h-10 px-3 rounded-lg border border-dashed border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl leading-none">{avatar_emoji}</span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {t('appearance.avatar.choose_emoji')}
                                </span>
                            </div>
                            <Smile className="w-4 h-4 text-primary opacity-60" aria-hidden="true" />
                        </button>

                        {showEmojiPicker && (
                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                <EmojiPicker
                                    theme={(theme === 'dark' || theme === 'midnight' || theme === 'comfort') ? EmojiTheme.DARK : EmojiTheme.LIGHT}
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
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
