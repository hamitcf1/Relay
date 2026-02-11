import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'
import { CustomCursor } from '@/components/ui/CustomCursor'

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 flex flex-col cursor-none relative overflow-x-hidden">
            <CustomCursor />
            <PublicNavbar />
            <div className="flex-grow pt-20">
                <Outlet />
            </div>
            <PublicFooter />
        </div>
    )
}
