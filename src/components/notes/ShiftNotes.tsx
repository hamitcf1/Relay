import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale } from '@/lib/utils'
import {
    Plus,
    Check,
    DollarSign,
    Clock,
    User,
    Trash2,
    Wand2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useNotesStore, categoryInfo, type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'

interface ShiftNotesProps {
    hotelId: string
    showAddButton?: boolean
}

export function ShiftNotes({ hotelId, showAddButton = true }: ShiftNotesProps) {
    const { notes, addNote, markPaid, deleteNote } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const [isAdding, setIsAdding] = useState(false)
    const [newCategory, setNewCategory] = useState<NoteCategory>('handover')
    const [newContent, setNewContent] = useState('')
    const [newRoom, setNewRoom] = useState('')
    const [newAmount, setNewAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [isAIModalOpen, setIsAIModalOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<NoteStatus | 'all'>('active')
    const [filter, setFilter] = useState<NoteCategory | 'all'>('all')

    // Filter notes
    const filteredNotes = useMemo(() => {
        return notes.filter((note) => {
            const matchesCategory = filter === 'all' || note.category === filter
            const matchesStatus = statusFilter === 'all' || note.status === statusFilter
            return matchesCategory && matchesStatus
        })
    }, [notes, filter, statusFilter])

    const handleAddNote = async () => {
        if (!newContent.trim() || !user) return

        setLoading(true)
        try {
            await addNote(hotelId, {
                category: newCategory,
                content: newContent.trim(),
                room_number: newRoom.trim() || null,
                is_relevant: true,
                amount_due: newCategory === 'damage' && newAmount ? parseFloat(newAmount) : null,
                is_paid: false,
                created_by: user.uid,
                created_by_name: user.name || 'Unknown',
                shift_id: null,
            })

            // Reset form
            setNewContent('')
            setNewRoom('')
            setNewAmount('')
            setIsAdding(false)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (noteId: string, status: NoteStatus) => {
        if (!user) return
        await useNotesStore.getState().updateNoteStatus(hotelId, noteId, status, user.uid)
    }

    const handleMarkPaid = async (noteId: string) => {
        await markPaid(hotelId, noteId)
    }

    const handleDelete = async (noteId: string) => {
        if (confirm(t('common.deleteConfirm'))) {
            await deleteNote(hotelId, noteId)
        }
    }

    // Calculate unread counts per category and status
    const counts = useMemo(() => {
        const c: Record<string, number> = { all: 0 }
        notes.forEach(note => {
            c[note.category] = (c[note.category] || 0) + 1
            c[note.status] = (c[note.status] || 0) + 1
            c.all++
        })
        return c
    }, [notes])

    return (
        <Card className="glass border-zinc-800/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        📋 {t('module.shiftNotes')}
                        {counts.active > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {counts.active} {t('status.active')}
                            </Badge>
                        )}
                    </CardTitle>

                    {showAddButton && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAdding(!isAdding)}
                            className="hover:bg-indigo-500/10 hover:text-indigo-400"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                    {[
                        { key: 'active' as const, label: t('status.active'), color: 'bg-emerald-500' },
                        { key: 'resolved' as const, label: t('status.resolved'), color: 'bg-indigo-500' },
                        { key: 'archived' as const, label: t('status.archived'), color: 'bg-zinc-600' },
                        { key: 'all' as const, label: t('status.all'), color: 'bg-zinc-400' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={cn(
                                'flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all',
                                statusFilter === tab.key
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            {tab.label}
                            {counts[tab.key] > 0 && (
                                <span className="ml-1 opacity-60">({counts[tab.key]})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { key: 'all' as const, label: t('category.allIssues'), color: 'bg-indigo-500', icon: '📁' },
                        { key: 'handover' as const, ...categoryInfo.handover, label: t('category.handover') },
                        { key: 'feedback' as const, ...categoryInfo.feedback, label: t('category.feedback') },
                        { key: 'damage' as const, ...categoryInfo.damage, label: t('category.damage') },
                        { key: 'guest_info' as const, ...categoryInfo.guest_info, label: t('category.guestInfo') },
                        { key: 'early_checkout' as const, ...categoryInfo.early_checkout, label: t('category.earlyCheckout') },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all',
                                filter === tab.key
                                    ? `${tab.color} text-white shadow-lg`
                                    : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700/70 hover:text-zinc-200'
                            )}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Add Note Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700"
                        >
                            {/* Category Selection */}
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(categoryInfo) as NoteCategory[]).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewCategory(cat)}
                                        className={cn(
                                            'text-xs px-2 py-1 rounded-full flex items-center gap-1.5 transition-all',
                                            newCategory === cat
                                                ? `${categoryInfo[cat].color} text-white shadow-sm`
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        )}
                                    >
                                        {categoryInfo[cat].icon}
                                        {t(`category.${cat === 'guest_info' ? 'guestInfo' : cat === 'early_checkout' ? 'earlyCheckout' : cat}` as any)}
                                    </button>
                                ))}
                            </div>

                            {/* Room & Amount (for damage) */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('common.room') + " #"}
                                    value={newRoom}
                                    onChange={(e) => setNewRoom(e.target.value)}
                                    className="w-24 text-sm bg-zinc-800/50"
                                />
                                {newCategory === 'damage' && (
                                    <Input
                                        placeholder={t('common.amount') + " ₺"}
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        className="w-28 text-sm bg-zinc-800/50"
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('module.shiftNotes')}</label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsAIModalOpen(true)}
                                        className="h-6 text-[9px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        {t('notes.aiHelp')}
                                    </Button>
                                </div>
                                <Input
                                    placeholder={t('module.shiftNotes') + "..."}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    className="text-sm bg-zinc-800/50"
                                />
                            </div>

                            <AIAssistantModal
                                isOpen={isAIModalOpen}
                                onClose={() => setIsAIModalOpen(false)}
                                initialTask="report"
                                initialPrompt={newContent}
                            />

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                    disabled={!newContent.trim() || loading}
                                    className="flex-1 bg-white text-black hover:bg-zinc-200"
                                >
                                    {loading ? <Clock className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3 h-3 mr-2" />}
                                    {t('common.save')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsAdding(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notes List */}
                {filteredNotes.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">{t('notes.noNotes')}</p>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredNotes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    'p-3 rounded-lg border transition-all group',
                                    note.status === 'active'
                                        ? 'border-zinc-800 bg-zinc-900/50'
                                        : 'border-zinc-800/30 bg-zinc-900/20 opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={cn(
                                                'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                                                categoryInfo[note.category].color,
                                                'text-white'
                                            )}>
                                                {categoryInfo[note.category].icon} {categoryInfo[note.category].label}
                                            </span>

                                            {note.room_number && (
                                                <Badge variant="outline" className="text-[10px] h-4 bg-zinc-800 text-zinc-400 border-zinc-700">#{note.room_number}</Badge>
                                            )}

                                            {note.category === 'damage' && note.amount_due && (
                                                <span className={cn(
                                                    'text-[10px] font-bold',
                                                    note.is_paid ? 'text-emerald-400' : 'text-rose-400'
                                                )}>
                                                    ₺{note.amount_due.toLocaleString()}
                                                    {note.is_paid && ' ✓'}
                                                </span>
                                            )}

                                            <Badge variant="outline" className={cn(
                                                "text-[9px] h-4 px-1 border-none",
                                                note.status === 'active' ? "text-emerald-500 bg-emerald-500/10" :
                                                    note.status === 'resolved' ? "text-indigo-500 bg-indigo-500/10" :
                                                        "text-zinc-500 bg-zinc-500/10"
                                            )}>
                                                {t(`status.${note.status}` as any).toUpperCase()}
                                            </Badge>
                                        </div>

                                        {/* Content */}
                                        <p className="text-sm text-zinc-300 mb-2 leading-relaxed">{note.content}</p>

                                        {/* Footer */}
                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-2.5 h-2.5" />
                                                {note.is_anonymous ? t('notes.anonymous') : note.created_by_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatDistanceToNow(note.created_at, { addSuffix: true, locale: getDateLocale() })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {note.category === 'damage' && !note.is_paid && note.amount_due && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleMarkPaid(note.id)}
                                                className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10"
                                            >
                                                <DollarSign className="w-3.5 h-3.5" />
                                            </Button>
                                        )}

                                        <Select
                                            value={note.status}
                                            onValueChange={(v) => handleStatusChange(note.id, v as NoteStatus)}
                                        >
                                            <SelectTrigger className="h-6 w-24 bg-zinc-950 border-zinc-800 text-[10px] px-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                                <SelectItem value="active" className="text-xs">{t('status.active')}</SelectItem>
                                                <SelectItem value="resolved" className="text-xs">{t('status.resolved')}</SelectItem>
                                                <SelectItem value="archived" className="text-xs">{t('status.archived')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {user?.role === 'gm' && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(note.id)}
                                                className="h-6 w-6 text-rose-500 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
