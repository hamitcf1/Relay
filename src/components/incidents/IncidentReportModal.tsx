import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Camera,
    AlertTriangle,
    Loader2,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { IncidentSeverity } from '@/types'

interface IncidentReportModalProps {
    isOpen: boolean
    onClose: () => void
    hotelId: string
    userId: string
}

const severityOptions: { value: IncidentSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-zinc-600' },
    { value: 'moderate', label: 'Moderate', color: 'bg-amber-500' },
    { value: 'serious', label: 'Serious', color: 'bg-orange-500' },
    { value: 'severe', label: 'Severe', color: 'bg-rose-500' },
]

export function IncidentReportModal({ isOpen, onClose, hotelId, userId }: IncidentReportModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState<IncidentSeverity>('moderate')
    const [roomNumber, setRoomNumber] = useState('')
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Limit to 1MB due to Firestore document size limits
        if (file.size > 1024 * 1024) {
            setError('Photo must be less than 1MB')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            setPhotoBase64(base64)
            setError(null)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim() || !description.trim()) {
            setError('Please fill in title and description')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const incidentsRef = collection(db, 'hotels', hotelId, 'incidents')

            await addDoc(incidentsRef, {
                title: title.trim(),
                description: description.trim(),
                severity,
                room_number: roomNumber.trim() || null,
                photo_base64: photoBase64,
                status: 'open',
                reported_by: userId,
                reported_at: serverTimestamp(),
            })

            // Reset and close
            setTitle('')
            setDescription('')
            setSeverity('moderate')
            setRoomNumber('')
            setPhotoBase64(null)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit report')
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
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
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-rose-500/10 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-500/20">
                                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <h2 className="font-semibold text-lg">Report Incident</h2>
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
                                {/* Severity */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Severity Level</label>
                                    <div className="flex gap-2">
                                        {severityOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setSeverity(opt.value)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all flex-1',
                                                    severity === opt.value
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-zinc-700 hover:border-zinc-600'
                                                )}
                                            >
                                                <div className={cn('w-2 h-2 rounded-full', opt.color)} />
                                                <span className="text-sm">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Title</label>
                                    <Input
                                        placeholder="Brief incident title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Room (optional) */}
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
                                        placeholder="Describe what happened in detail..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        required
                                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
                                    />
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">
                                        Photo Evidence <span className="text-zinc-600">(optional, max 1MB)</span>
                                    </label>

                                    {photoBase64 ? (
                                        <div className="relative">
                                            <img
                                                src={photoBase64}
                                                alt="Evidence"
                                                className="w-full h-40 object-cover rounded-lg border border-zinc-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPhotoBase64(null)}
                                                className="absolute top-2 right-2 p-2 bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                                            <Camera className="w-8 h-8 text-zinc-500 mb-2" />
                                            <span className="text-sm text-zinc-500">Click to upload photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
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
                                        variant="destructive"
                                        disabled={loading}
                                        className="flex-1 bg-rose-600 hover:bg-rose-700"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-4 h-4" />
                                                Submit Report
                                            </>
                                        )}
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
