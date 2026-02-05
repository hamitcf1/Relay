import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, AlertTriangle, MessageSquare, Wrench, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLogsStore } from '@/stores/logsStore'
import { useAuthStore } from '@/stores/authStore'
import type { LogType, LogUrgency } from '@/types'

interface NewLogModalProps {
    isOpen: boolean
    onClose: () => void
}

const logTypes: { value: LogType; label: string; icon: React.ElementType }[] = [
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'guest_request', label: 'Guest Request', icon: MessageSquare },
    { value: 'complaint', label: 'Complaint', icon: AlertTriangle },
    { value: 'system', label: 'System', icon: Settings },
]

const urgencyLevels: { value: LogUrgency; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-zinc-700' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
    { value: 'critical', label: 'Critical', color: 'bg-rose-500' },
]

export function NewLogModal({ isOpen, onClose }: NewLogModalProps) {
    const { addLog } = useLogsStore()
    const { user } = useAuthStore()

    const [type, setType] = useState<LogType>('guest_request')
    const [urgency, setUrgency] = useState<LogUrgency>('low')
    const [content, setContent] = useState('')
    const [roomNumber, setRoomNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim()) {
            setError('Please enter a description')
            return
        }

        if (!user) {
            setError('You must be logged in')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await addLog({
                type,
                urgency,
                content: content.trim(),
                room_number: roomNumber.trim() || null,
                status: 'open',
                created_by: user.uid,
                is_pinned: false,
            })

            // Reset form
            setContent('')
            setRoomNumber('')
            setType('guest_request')
            setUrgency('low')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create log')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass rounded-2xl w-full max-w-lg overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-indigo-400" />
                                    <h2 className="text-lg font-semibold">New Log Entry</h2>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Log Type */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {logTypes.map((t) => {
                                            const Icon = t.icon
                                            return (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setType(t.value)}
                                                    className={cn(
                                                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                                                        type === t.value
                                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="text-sm">{t.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Urgency */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Urgency</label>
                                    <div className="flex gap-2">
                                        {urgencyLevels.map((u) => (
                                            <button
                                                key={u.value}
                                                type="button"
                                                onClick={() => setUrgency(u.value)}
                                                className={cn(
                                                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                                                    urgency === u.value
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-zinc-700 hover:border-zinc-600'
                                                )}
                                            >
                                                <div className={cn('w-2 h-2 rounded-full', u.color)} />
                                                <span className="text-sm">{u.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Room Number */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">
                                        Room Number <span className="text-zinc-600">(optional)</span>
                                    </label>
                                    <Input
                                        placeholder="e.g. 204"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        className="w-32"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Description</label>
                                    <textarea
                                        placeholder="Describe the issue or request... Use #204 to link rooms"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {loading ? 'Creating...' : 'Create Log'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
