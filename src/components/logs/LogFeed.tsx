import { AnimatePresence } from 'framer-motion'
import { FileText } from 'lucide-react'
import { LogCard } from './LogCard'
import type { Log } from '@/types'

interface LogFeedProps {
    logs: Log[]
    loading?: boolean
    onTogglePin?: (logId: string, isPinned: boolean) => void
    onResolve?: (logId: string) => void
    onRoomClick?: (roomNumber: string) => void
}

export function LogFeed({
    logs,
    loading,
    onTogglePin,
    onResolve,
    onRoomClick
}: LogFeedProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="glass rounded-xl p-4 animate-pulse"
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-zinc-800 rounded w-1/4" />
                                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                                <div className="h-3 bg-zinc-800 rounded w-1/5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 glass rounded-xl">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400 mb-2">No logs yet</h3>
                <p className="text-zinc-500 text-sm">
                    Activity logs will appear here in real-time
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {logs.map((log) => (
                    <LogCard
                        key={log.id}
                        log={log}
                        onTogglePin={onTogglePin}
                        onResolve={onResolve}
                        onRoomClick={onRoomClick}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
