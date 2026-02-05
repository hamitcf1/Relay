import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
    Wrench,
    MessageSquare,
    AlertTriangle,
    Settings,
    Pin,
    PinOff,
    CheckCircle,
    Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Log, LogType, LogUrgency } from '@/types'

interface LogCardProps {
    log: Log
    onTogglePin?: (logId: string, isPinned: boolean) => void
    onResolve?: (logId: string) => void
    onRoomClick?: (roomNumber: string) => void
    compact?: boolean
}

// Icon mapping for log types
const typeIcons: Record<LogType, React.ElementType> = {
    maintenance: Wrench,
    guest_request: MessageSquare,
    complaint: AlertTriangle,
    system: Settings,
}

// Color mapping for urgency
const urgencyStyles: Record<LogUrgency, string> = {
    low: 'border-zinc-700',
    medium: 'border-amber-500/50',
    critical: 'border-rose-500/50 glow-critical',
}

const urgencyBadgeVariants: Record<LogUrgency, 'secondary' | 'default' | 'destructive'> = {
    low: 'secondary',
    medium: 'default',
    critical: 'destructive',
}

// Parse content for room numbers (#204 pattern)
function parseRoomLinks(
    content: string,
    onRoomClick?: (room: string) => void
): React.ReactNode[] {
    const roomPattern = /#(\d{3,4})/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = roomPattern.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index))
        }

        // Add room badge
        const roomNumber = match[1]
        parts.push(
            <Badge
                key={`room-${match.index}`}
                variant="room"
                className="mx-1 cursor-pointer"
                onClick={() => onRoomClick?.(roomNumber)}
            >
                #{roomNumber}
            </Badge>
        )

        lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [content]
}

export function LogCard({
    log,
    onTogglePin,
    onResolve,
    onRoomClick,
    compact = false
}: LogCardProps) {
    const Icon = typeIcons[log.type]

    const parsedContent = useMemo(
        () => parseRoomLinks(log.content, onRoomClick),
        [log.content, onRoomClick]
    )

    const timeAgo = useMemo(
        () => formatDistanceToNow(log.created_at, { addSuffix: true }),
        [log.created_at]
    )

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                'glass rounded-xl border-l-4 transition-all duration-200',
                urgencyStyles[log.urgency],
                log.urgency === 'critical' && 'animate-glow-pulse',
                compact ? 'p-3' : 'p-4'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                    'p-2 rounded-lg',
                    log.urgency === 'critical' ? 'bg-rose-500/20' : 'bg-zinc-800'
                )}>
                    <Icon className={cn(
                        'w-4 h-4',
                        log.urgency === 'critical' ? 'text-rose-400' : 'text-zinc-400'
                    )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={urgencyBadgeVariants[log.urgency]}>
                            {log.urgency}
                        </Badge>
                        <span className="text-xs text-zinc-500 capitalize">{log.type.replace('_', ' ')}</span>
                        {log.room_number && (
                            <Badge variant="room" onClick={() => onRoomClick?.(log.room_number!)}>
                                #{log.room_number}
                            </Badge>
                        )}
                        {log.status === 'resolved' && (
                            <Badge variant="success" className="gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                            </Badge>
                        )}
                    </div>

                    <p className={cn(
                        'text-zinc-200 leading-relaxed',
                        compact ? 'text-sm line-clamp-2' : ''
                    )}>
                        {parsedContent}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                    </div>
                </div>

                {/* Actions */}
                {!compact && (
                    <div className="flex items-center gap-1">
                        {log.status === 'open' && onResolve && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onResolve(log.id)}
                                title="Mark as resolved"
                            >
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </Button>
                        )}
                        {onTogglePin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onTogglePin(log.id, !log.is_pinned)}
                                title={log.is_pinned ? 'Unpin' : 'Pin to board'}
                            >
                                {log.is_pinned ? (
                                    <PinOff className="w-4 h-4 text-indigo-400" />
                                ) : (
                                    <Pin className="w-4 h-4 text-zinc-400" />
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
