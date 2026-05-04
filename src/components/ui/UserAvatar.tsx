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
                size === 'xs' && "h-6 w-6",
                size === 'sm' && "h-10 w-10",
                size === 'md' && "h-14 w-14",
                size === 'lg' && "h-20 w-20",
                size === 'xl' && "h-32 w-32",
                className
            )}>
                <UserIcon className={cn(
                    "text-muted-foreground",
                    size === 'xs' && "w-4 h-4",
                    size === 'sm' && "w-6 h-6",
                    size === 'md' && "w-8 h-8",
                    size === 'lg' && "w-10 h-10",
                    size === 'xl' && "w-16 h-16"
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
            size === 'xs' && "h-6 w-6",
            size === 'sm' && "h-10 w-10",
            size === 'md' && "h-14 w-14",
            size === 'lg' && "h-20 w-20",
            size === 'xl' && "h-32 w-32",
            className
        )}>
            {avatar_style === 'emoji' && avatar_emoji ? (
                <span className={cn(
                    "leading-none select-none",
                    size === 'xs' && "text-sm",
                    size === 'sm' && "text-xl",
                    size === 'md' && "text-3xl",
                    size === 'lg' && "text-5xl",
                    size === 'xl' && "text-7xl"
                )}>
                    {avatar_emoji}
                </span>
            ) : avatar_style === 'name' ? (
                <span className={cn(
                    "font-bold text-primary-foreground select-none truncate px-1",
                    size === 'xs' && "text-[7px]",
                    size === 'sm' && "text-[10px]",
                    size === 'md' && "text-sm",
                    size === 'lg' && "text-lg",
                    size === 'xl' && "text-2xl"
                )}>
                    {user.name}
                </span>
            ) : (
                <span className={cn(
                    "font-extrabold text-primary-foreground select-none tracking-tighter text-center px-0.5",
                    size === 'xs' ? "text-[10px]" : "",
                    size === 'sm' ? "text-sm" : "",
                    size === 'md' ? "text-xl" : "",
                    size === 'lg' ? "text-3xl" : "",
                    size === 'xl' ? "text-5xl" : ""
                )}>
                    {initials}
                </span>
            )}
        </div>
    )
}
