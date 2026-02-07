import { motion, AnimatePresence } from 'framer-motion'
import { Pin } from 'lucide-react'
import { useLogsStore } from '@/stores/logsStore'
import { LogCard } from './LogCard'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useLanguageStore } from '@/stores/languageStore'

export function StickyBoard() {
    const { pinnedLogs, togglePin, updateLogStatus, archiveLog } = useLogsStore()
    const { t } = useLanguageStore()

    if (pinnedLogs.length === 0) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-500 px-1">
                <Pin className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">{t('log.stickyBoard')}</h3>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded-full border border-zinc-800">
                    {pinnedLogs.length}
                </span>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                <div className="flex gap-4 p-4 min-w-max">
                    <AnimatePresence mode='popLayout'>
                        {pinnedLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-[300px] whitespace-normal"
                            >
                                <LogCard
                                    log={log}
                                    onTogglePin={(id, val) => togglePin(id, val)}
                                    // Cast status to match LogStatus triggers if needed, but LogCard handles it
                                    onResolve={(id) => updateLogStatus(id, 'resolved')}
                                    onArchive={(id) => archiveLog(id)}
                                    compact // Assuming LogCard might support a compact mode, or we just rely on its responsive design
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <ScrollBar orientation="horizontal" className="bg-amber-500/10" />
            </ScrollArea>
        </div>
    )
}
