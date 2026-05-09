import { useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import {
    LogOut,
    Globe,
    Check,
    Palette,
    ChevronDown,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { AppearanceOptions } from '@/components/settings/AppearanceOptions'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'

export function UserNav() {
    const { user, signOut } = useAuthStore()
    const { t, language, setLanguage } = useLanguageStore()
    const isMobile = useIsMobile()
    const [showAppearanceDialog, setShowAppearanceDialog] = useState(false)
    const [showLanguageDialog, setShowLanguageDialog] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 h-9 rounded-lg border border-border/50 bg-card/40 hover:bg-card/70 hover:border-border transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <UserAvatar user={user} size="sm" className="shadow-none" />
                        <div className="hidden sm:flex flex-col items-start leading-tight">
                            <span className="text-xs font-semibold text-foreground">
                                {user?.name?.split(' ')[0]} {user?.name?.split(' ').slice(1).map(n => n[0]).join('.')}.
                            </span>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                                {user?.role}
                            </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border p-1">
                    <DropdownMenuLabel className="px-2 py-1.5">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{user?.name || t('common.unknown')}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</span>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-border my-1" />

                    {/* APPEARANCE */}
                    {isMobile ? (
                        <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setShowAppearanceDialog(true); }}
                            className="gap-2 cursor-pointer text-sm"
                        >
                            <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <span>{t('common.appearance')}</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-sm">
                                <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                <span>{t('common.appearance')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-80 bg-card border-border p-4">
                                    <AppearanceOptions />
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    )}

                    {/* LANGUAGE */}
                    {isMobile ? (
                        <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setShowLanguageDialog(true); }}
                            className="gap-2 cursor-pointer text-sm"
                        >
                            <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <span>{t('common.language')}</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-sm">
                                <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                <span>{t('common.language')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-40 bg-card border-border p-1">
                                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-sm cursor-pointer">
                                        English {language === 'en' && <Check className="ml-auto w-3.5 h-3.5" aria-hidden="true" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('tr')} className="text-sm cursor-pointer">
                                        Türkçe {language === 'tr' && <Check className="ml-auto w-3.5 h-3.5" aria-hidden="true" />}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    )}

                    <DropdownMenuSeparator className="bg-border my-1" />

                    <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10">
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>{t('auth.logout')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Modals */}
            <Dialog open={showAppearanceDialog} onOpenChange={setShowAppearanceDialog}>
                <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>{t('common.appearance')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Customize the application appearance and theme settings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <AppearanceOptions />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
                <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>{t('common.language')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Select your preferred language.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <button
                            onClick={() => { setLanguage('en'); setShowLanguageDialog(false); }}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors active:scale-[0.98]",
                                language === 'en' ? "bg-primary/10 border-primary/50 text-foreground" : "bg-card border-border hover:bg-muted/50"
                            )}
                        >
                            <span className="text-sm font-medium">English</span>
                            {language === 'en' && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                        </button>
                        <button
                            onClick={() => { setLanguage('tr'); setShowLanguageDialog(false); }}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors active:scale-[0.98]",
                                language === 'tr' ? "bg-primary/10 border-primary/50 text-foreground" : "bg-card border-border hover:bg-muted/50"
                            )}
                        >
                            <span className="text-sm font-medium">Türkçe</span>
                            {language === 'tr' && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
