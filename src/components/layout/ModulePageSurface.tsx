import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ModulePageSurfaceProps = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
    wide?: boolean
    flush?: boolean
}

export function ModulePageSurface({ children, wide = false, flush = false, className, ...props }: ModulePageSurfaceProps) {
    return <div {...props} className={cn('mx-auto w-full pb-24 md:pb-10', wide ? 'max-w-[1440px]' : 'max-w-6xl', flush ? '' : 'px-4 py-5 sm:px-6 md:py-7 lg:px-8', className)}>{children}</div>
}
