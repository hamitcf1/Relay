import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User,
    LogOut,
    Play,
    StopCircle,
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
import { useShiftStore } from '@/stores/shiftStore'
import { cn } from '@/lib/utils'

export function UserNav({ onOpenHandover }: { onOpenHandover: () => void; onOpenAI: any; onOpenRoomManager: any }) {
    // Keeping props for compatibility but ignoring unused ones for now to avoid refactoring parent
    const navigate = useNavigate()
    const { user, signOut } = useAuthStore()
    const { t, language, setLanguage } = useLanguageStore()
    const { currentShift } = useShiftStore()

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
                    <button className="h-9 w-9 rounded-full bg-primary flex items-center justify-center border border-primary/50 shadow-lg shadow-primary/20 ml-2 hover:bg-primary/90 transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <span className="text-xs font-bold text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4 text-primary-foreground" />}
                        </span>
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

                        {/* AI Button Removed - Now Floating FAB */}
                        {/* Rooms Button Removed - Now in Operations Hub */}

                        <DropdownMenuSeparator className="bg-border" />

                        {!currentShift ? (
                            <DropdownMenuItem onClick={() => navigate('/shift-start')} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 cursor-pointer px-3 py-2 rounded-lg focus:bg-emerald-500/10 transition-colors">
                                <Play className="w-4 h-4" />
                                <span className="text-xs font-medium">{t('dashboard.startShift')}</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={onOpenHandover} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 cursor-pointer px-3 py-2 rounded-lg focus:bg-rose-500/10 transition-colors">
                                <StopCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">{t('dashboard.endShift')}</span>
                            </DropdownMenuItem>
                        )}
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
