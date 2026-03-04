import { User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { User } from '@/types'

interface UserAvatarProps {
    user: User | null
    className?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function UserAvatar({ user, className, size = 'md' }: UserAvatarProps) {
    if (!user) {
        return (
            <div className={cn(
                "rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden",
                size === 'xs' && "h-5 w-5",
                size === 'sm' && "h-7 w-7",
                size === 'md' && "h-9 w-9",
                size === 'lg' && "h-12 w-12",
                size === 'xl' && "h-16 w-16",
                className
            )}>
                <UserIcon className={cn(
                    "text-muted-foreground",
                    size === 'xs' && "w-3 h-3",
                    size === 'sm' && "w-4 h-4",
                    size === 'md' && "w-5 h-5",
                    size === 'lg' && "w-7 h-7",
                    size === 'xl' && "w-10 h-10"
                )} />
            </div>
        )
    }

    const { avatar_style = 'initials', avatar_emoji } = user.settings || {}

    // Generate initials: Only the Full First Name
    const nameParts = user.name?.split(' ').filter(Boolean) || []
    const initials = nameParts.length > 0 ? nameParts[0].toUpperCase() : '??'

    return (
        <div className={cn(
            "rounded-full bg-primary flex items-center justify-center border border-primary/50 shadow-lg shadow-primary/20 transition-all overflow-hidden",
            size === 'xs' && "h-5 w-5",
            size === 'sm' && "h-7 w-7",
            size === 'md' && "h-9 w-9",
            size === 'lg' && "h-12 w-12",
            size === 'xl' && "h-16 w-16",
            className
        )}>
            {avatar_style === 'emoji' && avatar_emoji ? (
                <span className={cn(
                    "leading-none select-none",
                    size === 'xs' && "text-[10px]",
                    size === 'sm' && "text-base",
                    size === 'md' && "text-xl",
                    size === 'lg' && "text-3xl",
                    size === 'xl' && "text-4xl"
                )}>
                    {avatar_emoji}
                </span>
            ) : avatar_style === 'name' ? (
                <span className={cn(
                    "font-bold text-primary-foreground select-none truncate px-1",
                    size === 'xs' && "text-[6px]",
                    size === 'sm' && "text-[8px]",
                    size === 'md' && "text-[10px]",
                    size === 'lg' && "text-xs",
                    size === 'xl' && "text-sm"
                )}>
                    {user.name}
                </span>
            ) : (
                <span className={cn(
                    "font-extrabold text-primary-foreground select-none tracking-tighter text-center px-0.5",
                    size === 'xs' && initials.length > 3 ? "text-[6px]" : size === 'xs' ? "text-[8px]" : "",
                    size === 'sm' && initials.length > 4 ? "text-[7px]" : size === 'sm' ? "text-[9px]" : "",
                    size === 'md' && initials.length > 5 ? "text-[8px]" : size === 'md' ? "text-[10px]" : "",
                    size === 'lg' && initials.length > 5 ? "text-xs" : size === 'lg' ? "text-sm" : "",
                    size === 'xl' && initials.length > 5 ? "text-base" : size === 'xl' ? "text-lg" : ""
                )}>
                    {initials}
                </span>
            )}
        </div>
    )
}
