import { cn } from '@/lib/utils'

interface RelayMarkProps {
    className?: string
    title?: string
}

export function RelayMark({ className, title = 'Relay' }: RelayMarkProps) {
    return (
        <svg
            viewBox="0 0 32 32"
            role="img"
            aria-label={title}
            className={cn('shrink-0', className)}
        >
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M4 3h13.1C23.7 3 28 7.1 28 13.2c0 3.1-1.3 5.8-3.7 7.7L30 29h-7.2l-8.3-10.3 4.2-3.6 2.4 2.9c1.1-1.1 1.7-2.7 1.7-4.6 0-3-2.2-5-5.8-5H9.7V29H4V3Zm7.4 8.5h5.2c1.8 0 2.9.8 2.9 2.2 0 .6-.2 1.1-.6 1.5l-2.2-2.7-5.3 4.5v-5.5Z"
            />
        </svg>
    )
}

interface RelayBrandProps {
    className?: string
    markClassName?: string
    wordmarkClassName?: string
    compact?: boolean
}

export function RelayBrand({ className, markClassName, wordmarkClassName, compact = false }: RelayBrandProps) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <RelayMark className={cn('h-8 w-8 text-[#F2A51A]', markClassName)} />
            {!compact && (
                <span className={cn('font-semibold tracking-[-0.025em]', wordmarkClassName)}>
                    Aetherius <span className="text-[#F2A51A]">Relay</span>
                </span>
            )}
        </span>
    )
}
