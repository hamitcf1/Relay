import { useState, useEffect } from 'react'
import {
    LogOut,
    Globe,
    Check,
    Palette,
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

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false)
    const [showAppearanceDialog, setShowAppearanceDialog] = useState(false)
    const [showLanguageDialog, setShowLanguageDialog] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] ml-2">
                        <UserAvatar user={user} size="sm" className="shadow-none border-primary/30 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all" />
                        <div className="flex flex-col items-start hidden sm:flex">
                            <span className="text-xs font-bold text-foreground leading-tight tracking-tight">
                                {user?.name?.split(' ')[0]} {user?.name?.split(' ').slice(1).map(n => n[0]).join('.')}.
                            </span>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase leading-none tracking-widest mt-0.5 opacity-70">
                                {user?.role}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-primary/20 hidden sm:block mx-0.5" />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14" height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary/60 group-hover:text-primary transition-colors duration-300"
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border p-2">
                    <DropdownMenuLabel className="px-2 py-1.5">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{user?.name || t('common.unknown')}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{user?.role}</span>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-border my-2" />

                    {/* APPEARANCE */}
                    {isMobile ? (
                        <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setShowAppearanceDialog(true); }}
                            className="gap-2 cursor-pointer focus:bg-indigo-500/10"
                        >
                            <Palette className="w-4 h-4 text-primary" />
                            <span className="text-foreground">{t('common.appearance')}</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-indigo-500/10">
                                <Palette className="w-4 h-4 text-primary" />
                                <span className="text-foreground">{t('common.appearance')}</span>
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
                            className="gap-2 cursor-pointer focus:bg-indigo-500/10"
                        >
                            <Globe className="w-4 h-4 text-primary" />
                            <span className="text-foreground">{t('common.language')}</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer focus:bg-indigo-500/10">
                                <Globe className="w-4 h-4 text-primary" />
                                <span className="text-foreground">{t('common.language')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-40 bg-card border-border p-1">
                                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-xs">
                                        🇺🇸 English {language === 'en' && <Check className="ml-auto w-3 h-3" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('tr')} className="text-xs">
                                        🇹🇷 Türkçe {language === 'tr' && <Check className="ml-auto w-3 h-3" />}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    )}

                    <div className="space-y-1 mt-2">
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal uppercase px-2">{t('dashboard.actions')}</DropdownMenuLabel>


                    </div>

                    <DropdownMenuSeparator className="bg-border my-2" />

                    <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-medium">{t('auth.logout')}</span>
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
                                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                language === 'en' ? "bg-primary/10 border-primary/50 text-foreground" : "bg-card border-border hover:bg-muted/50"
                            )}
                        >
                            <span className="text-sm font-medium">🇺🇸 English</span>
                            {language === 'en' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                            onClick={() => { setLanguage('tr'); setShowLanguageDialog(false); }}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                language === 'tr' ? "bg-primary/10 border-primary/50 text-foreground" : "bg-card border-border hover:bg-muted/50"
                            )}
                        >
                            <span className="text-sm font-medium">🇹🇷 Türkçe</span>
                            {language === 'tr' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
