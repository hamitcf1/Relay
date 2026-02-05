import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FileText, Archive, CheckCircle, Clock } from 'lucide-react'
import { LogCard } from './LogCard'
import type { Log } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'

interface LogFeedProps {
    logs: Log[]
    loading?: boolean
    onTogglePin?: (logId: string, isPinned: boolean) => void
    onResolve?: (logId: string, currentStatus: string) => void
    onArchive?: (logId: string) => void
    onEdit?: (log: Log) => void
    onRoomClick?: (roomNumber: string) => void
}

export function LogFeed({
    logs,
    loading,
    onTogglePin,
    onResolve,
    onArchive,
    onEdit,
    onRoomClick
}: LogFeedProps) {
    const { t } = useLanguageStore()
    const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'archived'>('open')

    // Filter logs based on active tab
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (activeTab === 'archived') return log.status === 'archived'
            if (activeTab === 'resolved') return log.status === 'resolved'
            return log.status === 'open'
        })
    }, [logs, activeTab])

    const tabs = [
        { id: 'open', label: t('status.active'), icon: Clock, count: logs.filter(l => l.status === 'open').length },
        { id: 'resolved', label: t('status.resolved'), icon: CheckCircle, count: logs.filter(l => l.status === 'resolved').length },
        { id: 'archived', label: t('status.archived'), icon: Archive, count: logs.filter(l => l.status === 'archived').length }
    ] as const

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

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all',
                            activeTab === tab.id
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.count > 0 && (
                            <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px]">
                                {tab.count}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {filteredLogs.length === 0 ? (
                <div className="text-center py-12 glass rounded-xl border-dashed border-zinc-800">
                    <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-zinc-400 mb-1">
                        {activeTab === 'open' ? 'No active logs' : activeTab === 'resolved' ? 'No resolved logs' : 'Archive empty'}
                    </h3>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {filteredLogs.map((log) => (
                            <LogCard
                                key={log.id}
                                log={log}
                                onTogglePin={onTogglePin}
                                onResolve={onResolve}
                                onArchive={onArchive}
                                onEdit={onEdit}
                                onRoomClick={onRoomClick}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
