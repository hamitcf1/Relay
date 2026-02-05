import { motion } from 'framer-motion'
import { Pin } from 'lucide-react'
import { LogCard } from './LogCard'
import type { Log } from '@/types'

interface StickyBoardProps {
    pinnedLogs: Log[]
    onTogglePin?: (logId: string, isPinned: boolean) => void
    onResolve?: (logId: string, currentStatus: string) => void
    onRoomClick?: (roomNumber: string) => void
}

export function StickyBoard({ pinnedLogs, onTogglePin, onResolve, onRoomClick }: StickyBoardProps) {
    if (pinnedLogs.length === 0) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Pin className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-300">Sticky Board</h2>
                <span className="text-xs text-zinc-500">
                    {pinnedLogs.length} pinned
                </span>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative">
                {/* Gradient fade on edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                {/* Scrollable content */}
                <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-thin">
                    {pinnedLogs.map((log) => (
                        <motion.div
                            key={log.id}
                            className="flex-shrink-0 w-80"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <LogCard
                                log={log}
                                onTogglePin={onTogglePin}
                                onResolve={onResolve}
                                onRoomClick={onRoomClick}
                                compact
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
