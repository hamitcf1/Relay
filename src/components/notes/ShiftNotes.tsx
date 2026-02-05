import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import {
    Plus,
    Check,
    X,
    DollarSign,
    Clock,
    User,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNotesStore, categoryInfo, type NoteCategory } from '@/stores/notesStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'

interface ShiftNotesProps {
    hotelId: string
    showAddButton?: boolean
}

export function ShiftNotes({ hotelId, showAddButton = true }: ShiftNotesProps) {
    const { notes, addNote, toggleRelevance, markPaid, deleteNote } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const [isAdding, setIsAdding] = useState(false)
    const [newCategory, setNewCategory] = useState<NoteCategory>('handover')
    const [newContent, setNewContent] = useState('')
    const [newRoom, setNewRoom] = useState('')
    const [newAmount, setNewAmount] = useState('')
    const [filter, setFilter] = useState<NoteCategory | 'all' | 'relevant'>('relevant')
    const [loading, setLoading] = useState(false)

    // Filter notes
    const filteredNotes = useMemo(() => {
        return notes.filter((note) => {
            if (filter === 'all') return true
            if (filter === 'relevant') return note.is_relevant
            return note.category === filter
        })
    }, [notes, filter])

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

    const handleToggleRelevance = async (noteId: string, isRelevant: boolean) => {
        await toggleRelevance(hotelId, noteId, isRelevant)
    }

    const handleMarkPaid = async (noteId: string) => {
        await markPaid(hotelId, noteId)
    }

    const handleDelete = async (noteId: string) => {
        if (confirm('Delete this note?')) {
            await deleteNote(hotelId, noteId)
        }
    }

    // Calculate unread counts per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: 0, relevant: 0 }
        notes.forEach(note => {
            counts[note.category] = (counts[note.category] || 0) + 1
            if (note.is_relevant) counts.relevant++
            counts.all++
        })
        return counts
    }, [notes])

    return (
        <Card className="glass border-zinc-800/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    {t('module.shiftNotes')}
                </CardTitle>
                <div className="flex gap-2">
                    {showAddButton && (
                        <div className="flex gap-1">
                            {/* ... */}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        📋 Shift Notes
                        {notes.filter(n => n.is_relevant).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {notes.filter(n => n.is_relevant).length} active
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

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { key: 'handover' as const, ...categoryInfo.handover, label: t('category.handover') },
                        { key: 'relevant' as const, label: t('status.active'), color: 'bg-emerald-500', icon: '✓' },
                        { key: 'all' as const, label: t('common.viewAll'), color: 'bg-zinc-600', icon: '📁' },
                        { key: 'damage' as const, ...categoryInfo.damage, label: t('category.damage') },
                        { key: 'guest_info' as const, ...categoryInfo.guest_info, label: t('category.guestInfo') },
                        { key: 'early_checkout' as const, ...categoryInfo.early_checkout, label: t('category.earlyCheckout') },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all',
                                filter === tab.key
                                    ? `${tab.color} text-white shadow-lg`
                                    : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700/70 hover:text-zinc-200'
                            )}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {categoryCounts[tab.key] > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                                    {categoryCounts[tab.key]}
                                </span>
                            )}
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
                            <Input
                                placeholder={t('module.shiftNotes') + "..."}
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="text-sm bg-zinc-800/50"
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
                    <p className="text-zinc-500 text-sm text-center py-4">No notes found</p>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredNotes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'p-3 rounded-lg border transition-all',
                                    note.is_relevant
                                        ? 'border-zinc-700 bg-zinc-800/50'
                                        : 'border-zinc-800 bg-zinc-900/30 opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={cn(
                                                'text-xs px-1.5 py-0.5 rounded',
                                                categoryInfo[note.category].color,
                                                'text-white'
                                            )}>
                                                {categoryInfo[note.category].icon} {categoryInfo[note.category].label}
                                            </span>

                                            {note.room_number && (
                                                <Badge variant="room" className="text-xs">#{note.room_number}</Badge>
                                            )}

                                            {note.category === 'damage' && note.amount_due && (
                                                <span className={cn(
                                                    'text-xs font-bold',
                                                    note.is_paid ? 'text-emerald-400' : 'text-rose-400'
                                                )}>
                                                    ₺{note.amount_due.toLocaleString()}
                                                    {note.is_paid && ' ✓'}
                                                </span>
                                            )}

                                            {!note.is_relevant && (
                                                <span className="text-xs text-zinc-500">Resolved</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <p className="text-sm text-zinc-200 mb-2">{note.content}</p>

                                        {/* Footer */}
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {note.created_by_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(note.created_at, { addSuffix: true })}
                                            </span>
                                            <span className="text-zinc-600">
                                                {format(note.created_at, 'MMM d, HH:mm')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {note.category === 'damage' && !note.is_paid && note.amount_due && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleMarkPaid(note.id)}
                                                title="Mark as Paid"
                                                className="h-7 w-7"
                                            >
                                                <DollarSign className="w-3 h-3 text-emerald-400" />
                                            </Button>
                                        )}

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleToggleRelevance(note.id, !note.is_relevant)}
                                            title={note.is_relevant ? 'Mark as Resolved' : 'Mark as Relevant'}
                                            className="h-7 w-7"
                                        >
                                            {note.is_relevant ? (
                                                <Check className="w-3 h-3 text-zinc-400" />
                                            ) : (
                                                <X className="w-3 h-3 text-zinc-400" />
                                            )}
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(note.id)}
                                            title="Delete"
                                            className="h-7 w-7"
                                        >
                                            <Trash2 className="w-3 h-3 text-zinc-500" />
                                        </Button>
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
