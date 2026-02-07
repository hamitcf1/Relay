import { useState, useEffect } from 'react'
import { Send, Shield, Loader2, Eye, CheckCircle2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotesStore } from '@/stores/notesStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import type { NoteStatus } from '@/types'
import { cn } from '@/lib/utils'

export function FeedbackSection() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { notes, subscribeToNotes, addNote, updateNoteStatus, loading } = useNotesStore()

    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const isGM = user?.role === 'gm'

    // Filter for feedback notes
    const complaints = notes.filter(n => n.category === 'feedback')

    const getStatusConfig = (status: NoteStatus) => {
        switch (status) {
            case 'active': return { label: 'Yeni', icon: Clock, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
            case 'resolved': return { label: 'Çözüldü', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
            case 'archived': return { label: 'Arşivlendi', icon: Eye, color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
            default: return { label: status, icon: Clock, color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
        }
    }

    const handleStatusChange = async (noteId: string, newStatus: NoteStatus) => {
        if (!hotel?.id || !user) return
        await updateNoteStatus(hotel.id, noteId, newStatus, user.uid)
    }

    useEffect(() => {
        if (hotel?.id) {
            const unsub = subscribeToNotes(hotel.id)
            return () => unsub()
        }
    }, [hotel?.id, subscribeToNotes])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || !hotel?.id) return

        setSubmitting(true)
        try {
            await addNote(hotel.id, {
                category: 'feedback',
                content: content.trim(),
                room_number: null,
                is_relevant: true,
                amount_due: null,
                is_paid: false,
                created_by: 'anonymous',
                created_by_name: 'Anonym',
                shift_id: null,
                is_anonymous: true
            })
            setContent('')
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error("Submission error:", error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t('feedback.anonymous.title')}</h2>
                    <p className="text-zinc-500 text-sm">{t('offday.petitions')} - {t('feedback.anonymous.subtitle')}</p>
                </div>
                {isGM && (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                        {t('feedback.management.view')}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submission Form */}
                <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden relative">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-200">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            {t('feedback.submit.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('feedback.submit.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <textarea
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Describe your concern or feedback here..."
                                    className="w-full h-40 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                />
                                <AnimatePresence>
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center rounded-xl border border-emerald-500/20"
                                        >
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Send className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-emerald-400 font-bold">Submitted Successfully</p>
                                                <p className="text-emerald-500/60 text-xs">Thank you for your feedback.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    disabled={submitting || !content.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-6 h-11"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit Anonymously
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card / Recent list for GM */}
                <div className="space-y-6">
                    <Card className="bg-emerald-500/5 border-emerald-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-emerald-400 text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {t('feedback.privacy.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] text-emerald-500/60 leading-relaxed">
                            {t('feedback.privacy.desc')}
                        </CardContent>
                    </Card>

                    {isGM && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider px-2">Recent Feedback</h3>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600" /></div>
                                ) : complaints.length === 0 ? (
                                    <p className="text-xs text-zinc-600 text-center py-4 bg-zinc-800/20 rounded-lg">No complaints to show.</p>
                                ) : (
                                    complaints.map(c => {
                                        const statusConfig = getStatusConfig(c.status)
                                        const StatusIcon = statusConfig.icon
                                        return (
                                            <motion.div
                                                key={c.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Complaint</span>
                                                        <Badge className={cn("text-[10px] px-1.5 h-4", statusConfig.color)}>
                                                            <StatusIcon className="w-2.5 h-2.5 mr-1" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500">{formatDistanceToNow(c.created_at, { addSuffix: true })}</span>
                                                </div>
                                                <p className="text-xs text-zinc-300 leading-normal">{c.content}</p>
                                                <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v as NoteStatus)}>
                                                    <SelectTrigger className="h-7 bg-zinc-950 border-zinc-700 text-xs w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Yeni</SelectItem>
                                                        <SelectItem value="resolved">Çözüldü</SelectItem>
                                                        <SelectItem value="archived">Arşivlendi</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
