import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ModulePageSurface({ children, wide = false, flush = false, className }: { children: ReactNode; wide?: boolean; flush?: boolean; className?: string }) {
    return <div className={cn('mx-auto w-full pb-24 md:pb-10', wide ? 'max-w-[1440px]' : 'max-w-6xl', flush ? '' : 'px-4 py-5 sm:px-6 md:py-7 lg:px-8', className)}>{children}</div>
}
