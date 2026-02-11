import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 flex flex-col relative overflow-x-hidden">
            <PublicNavbar />
            <div className="flex-grow pt-20">
                <Outlet />
            </div>
            <PublicFooter />
        </div>
    )
}
