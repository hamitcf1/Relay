
import { Outlet, useLocation } from 'react-router-dom'
import { MobileBottomNav } from './MobileBottomNav'
import { UpdateNotifier } from '@/components/layout/UpdateNotifier'
import { TabNotifications } from '@/components/ui/TabNotifications'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { ActivityTracker } from '@/components/tracking/ActivityTracker'
import { AIChatBot } from '@/components/ai/AIChatBot'
import { cn } from '@/lib/utils'

export function AppShell() {
    const location = useLocation()

    // Check if we are on a page that should show the bottom nav
    const showBottomNav = !['/login', '/register', '/live-demo', '/landing'].includes(location.pathname)

    return (
        <div className="h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-hidden relative touch-manipulation">
            {/* Global Components */}
            <UpdateNotifier />
            <TabNotifications />
            <CustomCursor />
            <ActivityTracker />

            {/* Main Content Area - Scrollable */}
            <div className={cn(
                "flex-1 overflow-x-hidden overflow-y-auto relative z-0",
                "pb-[calc(4rem+env(safe-area-inset-bottom))]" // Padding for bottom nav + iPhone Home Indicator
            )}>
                <Outlet />
            </div>

            {/* Navigation Layer */}
            {showBottomNav && <MobileBottomNav />}

            <AIChatBot />
        </div>
    )
}
