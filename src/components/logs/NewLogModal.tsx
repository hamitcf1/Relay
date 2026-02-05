import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, AlertTriangle, MessageSquare, Wrench, Settings, Edit2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLogsStore } from '@/stores/logsStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'
import type { Log, LogType, LogUrgency } from '@/types'

interface NewLogModalProps {
    isOpen: boolean
    onClose: () => void
    initialLog?: Log // If provided, we are in edit mode
}

export function NewLogModal({ isOpen, onClose, initialLog }: NewLogModalProps) {
    const { addLog, editLog } = useLogsStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const logTypes: { value: LogType; label: string; icon: React.ElementType }[] = [
        { value: 'maintenance', label: t('module.maintenance'), icon: Wrench },
        { value: 'guest_request', label: t('module.guest_request'), icon: MessageSquare },
        { value: 'complaint', label: t('module.complaint'), icon: AlertTriangle },
        { value: 'system', label: t('module.system'), icon: Settings },
    ]

    const urgencyLevels: { value: LogUrgency; label: string; color: string }[] = [
        { value: 'low', label: t('status.low'), color: 'bg-zinc-700' },
        { value: 'medium', label: t('status.medium'), color: 'bg-amber-500' },
        { value: 'critical', label: t('status.critical'), color: 'bg-rose-500' },
    ]

    const [type, setType] = useState<LogType>('guest_request')
    const [urgency, setUrgency] = useState<LogUrgency>('low')
    const [content, setContent] = useState('')
    const [roomNumber, setRoomNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [isAIModalOpen, setIsAIModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Pre-fill if editing
    useEffect(() => {
        if (initialLog) {
            setType(initialLog.type)
            setUrgency(initialLog.urgency)
            setContent(initialLog.content)
            setRoomNumber(initialLog.room_number || '')
        } else {
            // Reset if adding new
            setType('guest_request')
            setUrgency('low')
            setContent('')
            setRoomNumber('')
        }
    }, [initialLog, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim()) {
            setError(t('log.error.enterDescription'))
            return
        }

        if (!user) {
            setError(t('log.error.mustBeLoggedIn'))
            return
        }

        setError(null)
        setLoading(true)

        try {
            if (initialLog) {
                // Edit Mode
                await editLog(initialLog.id, {
                    type,
                    urgency,
                    content,
                    room_number: roomNumber || null
                })
            } else {
                // Add Mode
                await addLog({
                    type,
                    content,
                    urgency,
                    room_number: roomNumber || null,
                    status: 'open',
                    created_by: user.uid,
                    created_by_name: user.name || t('common.staff'), // Pass creator name
                    is_pinned: false
                })
            }

            onClose()
            // Cleanup form is handled by useEffect when isOpen changes or when re-opened
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Reset state on close if not editing (to clear fields for next "New Log")
    // But if editing, we want to reset to initialLog or clear. 
    // The useEffect above handles strict sync with initialLog.

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    {initialLog ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                                    {initialLog ? t('log.edit') : t('log.new')}
                                </h2>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-800">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="log-form" onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Type Selection */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-400">{t('log.typeLabel')}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {logTypes.map((t) => (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setType(t.value)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all",
                                                        type === t.value
                                                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                                            : "bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                                                    )}
                                                >
                                                    <t.icon className="w-4 h-4" />
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Urgency */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-400">{t('log.urgencyLabel')}</label>
                                        <div className="flex gap-3">
                                            {urgencyLevels.map((u) => (
                                                <button
                                                    key={u.value}
                                                    type="button"
                                                    onClick={() => setUrgency(u.value)}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-all",
                                                        urgency === u.value
                                                            ? "border-transparent text-white ring-2 ring-indigo-500/50"
                                                            : "bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
                                                        urgency === u.value ? u.color : ""
                                                    )}
                                                >
                                                    {u.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-zinc-400">{t('log.contentLabel')}</label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsAIModalOpen(true)}
                                                className="h-7 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                                            >
                                                <Wand2 className="w-3.5 h-3.5" />
                                                {t('log.aiHelp')}
                                            </Button>
                                        </div>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder={t('log.enterContent')}
                                            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>

                                    <AIAssistantModal
                                        isOpen={isAIModalOpen}
                                        onClose={() => setIsAIModalOpen(false)}
                                        initialTask="report"
                                        initialPrompt={content}
                                    />
                                    {/* Room Number (Optional) */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-400">{t('log.roomNumberLabel')}</label>
                                        <Input
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                            placeholder={t('log.roomPlaceholder')}
                                            className="bg-zinc-800/50 border-zinc-700"
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0 flex justify-end gap-3">
                                <Button variant="ghost" onClick={onClose} disabled={loading}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    form="log-form"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {loading ? t('common.loading') : (initialLog ? t('log.save') : t('log.create'))}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
