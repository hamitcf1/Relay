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
    Archive,
    Edit2,
    Undo2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Log, LogType, LogUrgency } from '@/types'
import { useLanguageStore } from '@/stores/languageStore'

interface LogCardProps {
    log: Log
    onTogglePin?: (logId: string, isPinned: boolean) => void
    onResolve?: (logId: string, currentStatus: string) => void
    onArchive?: (logId: string) => void
    onEdit?: (log: Log) => void
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

// Helper to handle Firestore timestamps which can be objects or dates
const getDate = (dateField: any): Date => {
    if (!dateField) return new Date()
    // Check if it has toDate method (Firestore Timestamp)
    if (typeof dateField.toDate === 'function') {
        return dateField.toDate()
    }
    // Check if it's already a Date object
    if (dateField instanceof Date) {
        return dateField
    }
    // Fallback or string
    return new Date(dateField)
}

export function LogCard({
    log,
    onTogglePin,
    onResolve,
    onArchive,
    onEdit,
    onRoomClick,
    compact = false
}: LogCardProps) {
    const { t } = useLanguageStore()
    const Icon = typeIcons[log.type]
    const isResolved = log.status === 'resolved'

    const parsedContent = useMemo(
        () => parseRoomLinks(log.content, onRoomClick),
        [log.content, onRoomClick]
    )

    const timeAgo = useMemo(
        () => formatDistanceToNow(getDate(log.created_at), { addSuffix: true }),
        [log.created_at]
    )

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative bg-zinc-900 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all",
                urgencyStyles[log.urgency],
                isResolved && "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
            )}
        >
            <div className={cn("p-4", compact && "py-3")}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] h-5 border-zinc-700 font-medium px-2 flex items-center gap-1.5", log.urgency === 'critical' && "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                                <Icon className="w-3 h-3" />
                                {t(`module.${log.type}` as any)}
                            </Badge>

                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                                log.urgency === 'low' && "text-zinc-500 bg-zinc-800/50",
                                log.urgency === 'medium' && "text-amber-500 bg-amber-500/10",
                                log.urgency === 'critical' && "text-rose-500 bg-rose-500/10"
                            )}>
                                {t(`status.${log.urgency}` as any)}
                            </span>

                            {log.created_by_name && (
                                <span className="text-[10px] text-zinc-600 block sm:inline">
                                    {t('common.by')} {log.created_by_name}
                                </span>
                            )}

                            <span className="text-[10px] text-zinc-600 ml-auto block sm:hidden">
                                {timeAgo}
                            </span>
                        </div>

                        <p className={cn("text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap", isResolved && "line-through text-zinc-500")}>
                            {parsedContent}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-medium hidden sm:block">
                            {timeAgo}
                        </span>

                        <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                            {/* Edit Button */}
                            {onEdit && !isResolved && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(log)}
                                    className="h-7 w-7 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full"
                                    title={t('common.edit')}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                            )}

                            {/* Pin Button */}
                            {onTogglePin && !isResolved && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onTogglePin(log.id, !log.is_pinned)}
                                    className={cn(
                                        "h-7 w-7 rounded-full transition-colors",
                                        log.is_pinned
                                            ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                            : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
                                    )}
                                >
                                    {log.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                </Button>
                            )}

                            {/* Archive Button */}
                            {onArchive && log.status === 'resolved' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onArchive(log.id)}
                                    className="h-7 w-7 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-full"
                                    title={t('common.archive')}
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                </Button>
                            )}

                            {/* Resolve/Reopen Button */}
                            {onResolve && (isResolved ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onResolve(log.id, log.status)}
                                    className="h-7 w-7 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full"
                                    title={t('common.reopen')}
                                >
                                    <Undo2 className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onResolve(log.id, log.status)}
                                    className="h-7 w-7 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full"
                                    title={t('common.resolve')}
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
