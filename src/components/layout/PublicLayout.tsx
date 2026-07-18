import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
    return (
        <div className="public-shell relative flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground selection:bg-primary/30">
            <PublicNavbar />
            <div className="relative flex-grow pt-[84px]">
                <Outlet />
            </div>
            <PublicFooter />
        </div>
    )
}
