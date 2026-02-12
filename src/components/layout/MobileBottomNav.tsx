
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities'

export function MobileBottomNav() {
    const { t } = useLanguageStore()
    const { isNative } = useMobileCapabilities()

    const handleHaptic = async () => {
        if (isNative) {
            await Haptics.impact({ style: ImpactStyle.Light })
        }
    }

    const navItems = [
        {
            to: "/dashboard",
            icon: LayoutDashboard,
            label: t('module.overview') || 'Overview',
            end: true
        },
        {
            to: "/operations",
            icon: Activity,
            label: t('module.operations') || 'Operations',
            end: false
        },
        // Using MessagesSquare as a placeholder for a dedicated comms tab if we split it out later
        // For now, let's stick to the core structure
        {
            to: "/team",
            icon: Users,
            label: t('module.team_label') || 'Team',
            end: false
        },
        {
            to: "/profile",
            icon: User,
            label: t('dashboard.userProfile') || 'Profile',
            end: false
        }
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
            <nav className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={handleHaptic}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-95 touch-manipulation",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActive ? "fill-primary/20 scale-110" : ""
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={cn(
                                    "text-[10px] font-medium transition-all duration-200",
                                    isActive ? "font-bold" : ""
                                )}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <div className="absolute top-0 h-0.5 w-8 bg-primary rounded-b-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
