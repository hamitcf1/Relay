import { useState, useMemo, useEffect } from 'react' // Force re-build
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale, formatDisplayDateTime } from '@/lib/utils'
import { Plus, Check, DollarSign, Clock, User, Trash2, Wand2, Pencil, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useNotesStore, categoryInfo, type NoteCategory, type NoteStatus } from '@/stores/notesStore'
import { type ShiftNote } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useChatStore } from '@/stores/chatStore'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'
import { FIXTURE_ITEMS, MINIBAR_ITEMS } from '@/lib/constants'
import { useFormatting } from '@/hooks/useFormatting'
import { FormattingContextMenu } from '@/components/ui/FormattingContextMenu'
import { TextFormatter } from '@/components/ui/TextFormatter'
import { useRef } from 'react'

interface ShiftNotesProps {
    hotelId: string
    showAddButton?: boolean
}

export function ShiftNotes({ hotelId, showAddButton = true }: ShiftNotesProps) {
    const { notes, addNote, updateNote, markPaid, deleteNote, convertToLog } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const { staff, subscribeToRoster } = useRosterStore()
    const { hotel } = useHotelStore()

    // Ensure we have staff list
    useEffect(() => {
        if (hotelId) {
            const unsub = subscribeToRoster(hotelId)
            return () => unsub()
        }
    }, [hotelId, subscribeToRoster])

    const [isAdding, setIsAdding] = useState(false)
    const [newCategory, setNewCategory] = useState<NoteCategory>('handover')
    const [newContent, setNewContent] = useState('')
    const [newRoom, setNewRoom] = useState('')
    const [newAmount, setNewAmount] = useState('')
    const [newTime, setNewTime] = useState('')
    const [newGuest, setNewGuest] = useState('')
    const [newAssignedStaff, setNewAssignedStaff] = useState<string>('')

    const newContentRef = useRef<HTMLTextAreaElement>(null)
    const newFormatting = useFormatting(newContent, setNewContent, newContentRef)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const [editCategory, setEditCategory] = useState<NoteCategory>('handover')
    const [editAmount, setEditAmount] = useState('')
    const [editRoom, setEditRoom] = useState('')
    const [editTime, setEditTime] = useState('')
    const [editGuest, setEditGuest] = useState('')
    const [editAssignedStaff, setEditAssignedStaff] = useState('none')

    const editContentRef = useRef<HTMLTextAreaElement>(null)
    const editFormatting = useFormatting(editContent, setEditContent, editContentRef)

    const [loading, setLoading] = useState(false)
    const { setOpen: setAIChatOpen, setTask: setAIChatTask } = useChatStore()
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

    const isFinancialCategory = (cat: string) => ['damage', 'upgrade', 'upsell', 'restaurant', 'minibar'].includes(cat)

    const [selectedFixtures, setSelectedFixtures] = useState<Record<string, number>>({})
    const [selectedMinibar, setSelectedMinibar] = useState<Record<string, number>>({})
    const [editSelectedFixtures, setEditSelectedFixtures] = useState<Record<string, number>>({})
    const [editSelectedMinibar, setEditSelectedMinibar] = useState<Record<string, number>>({})

    // Auto-calculate amount and content when fixtures change
    useEffect(() => {
        if (newCategory !== 'damage') return

        const items = Object.entries(selectedFixtures).filter(([_, count]) => count > 0)

        if (items.length === 0) {
            setNewAmount('')
            setNewContent('')
            return
        }

        let total = 0
        const contentParts: string[] = []

        items.forEach(([item, count]) => {
            const price = hotel?.settings?.fixture_prices?.[item] || 0
            total += price * count
            contentParts.push(`${t(`fixture.${item}` as any)} (x${count})`)
        })

        setNewAmount(total.toString())
        setNewContent(contentParts.join(', '))
    }, [selectedFixtures, newCategory, hotel?.settings?.fixture_prices, t])

    // Auto-calculate amount and content when minibar change
    useEffect(() => {
        if (newCategory !== 'minibar') return

        const items = Object.entries(selectedMinibar).filter(([_, count]) => count > 0)

        if (items.length === 0) {
            setNewAmount('')
            setNewContent('')
            return
        }

        let total = 0
        const contentParts: string[] = []

        items.forEach(([item, count]) => {
            const price = hotel?.settings?.minibar_prices?.[item] || 0
            total += price * count
            contentParts.push(`${t(`minibar.${item}` as any)} (x${count})`)
        })

        setNewAmount(total.toString())
        setNewContent(contentParts.join(', '))
    }, [selectedMinibar, newCategory, hotel?.settings?.minibar_prices, t])

    const handleAddNote = async () => {
        if (!newContent.trim() || !user) return

        setLoading(true)
        try {
            await addNote(hotelId, {
                category: newCategory,
                content: newContent.trim(),
                room_number: newRoom.trim() || null,
                is_relevant: true,
                amount_due: isFinancialCategory(newCategory) && newAmount ? parseFloat(newAmount) : null,
                is_paid: false,
                created_by: user.uid,
                created_by_name: user.name || 'Unknown',
                shift_id: null,
                // New Fields
                time: newTime || null,
                guest_name: newGuest.trim() || null,
                assigned_staff_uid: (newAssignedStaff && newAssignedStaff !== 'none') ? newAssignedStaff : null,
                assigned_staff_name: (newAssignedStaff && newAssignedStaff !== 'none') ? (staff.find(s => s.uid === newAssignedStaff)?.name || null) : null
            })

            // Reset form
            setNewContent('')
            setNewRoom('')
            setNewAmount('')
            setNewTime('')
            setNewGuest('')
            setNewAssignedStaff('')
            setSelectedFixtures({}) // Reset fixtures
            setSelectedMinibar({}) // Reset minibar
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

    const handleConvertToLog = async (noteId: string) => {
        if (confirm('Convert this note to a system log?')) {
            await convertToLog(hotelId, noteId)
        }
    }

    const startEditing = (note: ShiftNote) => {
        setEditingId(note.id)
        setEditContent(note.content)
        setEditCategory(note.category)
        setEditAmount(note.amount_due?.toString() || '')
        setEditRoom(note.room_number || '')
        setEditTime(note.time || '')
        setEditGuest(note.guest_name || '')
        setEditAssignedStaff(note.assigned_staff_uid || 'none')

        // Parse fixtures if damage category
        if (note.category === 'damage') {
            const fixtures: Record<string, number> = {}
            FIXTURE_ITEMS.forEach(item => {
                const itemName = t(`fixture.${item}` as any)
                // Regex to find "ItemName (xN)"
                // We need to escape itemName for regex
                const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`${escapedName}\\s*\\(x(\\d+)\\)`)
                const match = note.content.match(regex)
                if (match) {
                    fixtures[item] = parseInt(match[1])
                }
            })
            setEditSelectedFixtures(fixtures)
        } else {
            setEditSelectedFixtures({})
        }

        // Parse minibar if minibar category
        if (note.category === 'minibar') {
            const minibar: Record<string, number> = {}
            MINIBAR_ITEMS.forEach(item => {
                const itemName = t(`minibar.${item}` as any)
                const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`${escapedName}\\s*\\(x(\\d+)\\)`)
                const match = note.content.match(regex)
                if (match) {
                    minibar[item] = parseInt(match[1])
                }
            })
            setEditSelectedMinibar(minibar)
        } else {
            setEditSelectedMinibar({})
        }
    }

    const handleUpdateNote = async () => {
        if (!editingId || !user) return
        try {
            setLoading(true)
            await updateNote(hotelId, editingId, {
                content: editContent,
                category: editCategory,
                room_number: editRoom.trim() || null,
                amount_due: isFinancialCategory(editCategory) && editAmount ? parseFloat(editAmount) : null,
                time: editTime || null,
                guest_name: editGuest.trim() || null,
                assigned_staff_uid: (editAssignedStaff && editAssignedStaff !== 'none') ? editAssignedStaff : null,
                assigned_staff_name: (editAssignedStaff && editAssignedStaff !== 'none') ? (staff.find(s => s.uid === editAssignedStaff)?.name || null) : null
            })
            setEditingId(null)
            setEditSelectedFixtures({}) // Reset edit fixtures
            setEditSelectedMinibar({}) // Reset edit minibar
        } finally {
            setLoading(false)
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
        <CollapsibleCard
            id="shift-notes"
            title={
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    📋 {t('module.shiftNotes')}
                    {counts.active > 0 && (
                        <Badge variant="success" className="text-[10px] h-5 py-0 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                            {counts.active} {t('status.active')}
                        </Badge>
                    )}
                </CardTitle>
            }
            headerActions={
                showAddButton && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsAdding(!isAdding)
                        }}
                        className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                )
            }
            className="glass border-border/50"
        >
            <div className="pt-2">
                {/* Status Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg border border-border/50">
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
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
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
                        { key: 'upgrade' as const, ...categoryInfo.upgrade, label: t('category.upgrade') },
                        { key: 'upsell' as const, ...categoryInfo.upsell, label: t('category.upsell') },
                        { key: 'restaurant' as const, ...categoryInfo.restaurant, label: t('category.restaurant') },
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
                                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 pt-4">
                {/* Add Note Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3 p-3 bg-card/50 rounded-lg border border-border"
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
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {categoryInfo[cat].icon}
                                        {t(`category.${cat === 'guest_info' ? 'guestInfo' : cat === 'early_checkout' ? 'earlyCheckout' : cat}` as any)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('common.room') + " #"}
                                    value={newRoom}
                                    onChange={(e) => setNewRoom(e.target.value)}
                                    className="w-20 text-sm bg-muted/50"
                                />
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-24 text-sm bg-muted/50"
                                />
                                {isFinancialCategory(newCategory) && (
                                    <Input
                                        placeholder={t('common.amount') + " ₺"}
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        className="w-24 text-sm bg-muted/50"
                                    />
                                )}
                            </div>

                            {/* Fixture Selector for Damage Category */}
                            {newCategory === 'minibar' && (
                                <div className="p-3 bg-muted/30 rounded-lg border border-border mb-4">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase mb-2 block tracking-wider">
                                        {t('hotel.settings.minibarPrices')}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {MINIBAR_ITEMS.map(item => {
                                            const count = selectedMinibar[item] || 0
                                            const price = hotel?.settings?.minibar_prices?.[item] || 0
                                            return (
                                                <div key={item} className="flex flex-col gap-1 p-2 rounded bg-card border border-border hover:border-primary/30 transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-foreground font-medium truncate">{t(`minibar.${item}` as any)}</span>
                                                        <span className="text-[9px] text-muted-foreground italic">₺{price}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const current = selectedMinibar[item] || 0
                                                                if (current > 0) {
                                                                    setSelectedMinibar(prev => ({ ...prev, [item]: current - 1 }))
                                                                }
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded text-xs transition-colors"
                                                            type="button"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-xs font-mono w-4 text-center text-foreground">{count}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedMinibar(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded text-xs transition-colors"
                                                            type="button"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {(!hotel?.settings?.minibar_prices || Object.keys(hotel.settings.minibar_prices).length === 0) && (
                                        <p className="text-[10px] text-amber-500/80 italic mt-2 flex items-center gap-1.5">
                                            <AlertTriangle className="w-3 h-3" />
                                            {t('notes.noFixturePrices')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {newCategory === 'damage' && (
                                <div className="p-3 bg-muted/30 rounded-lg border border-border mb-2">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase mb-2 block">{t('hotel.settings.fixturePrices')}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {FIXTURE_ITEMS.map(item => {
                                            const price = hotel?.settings?.fixture_prices?.[item]
                                            if (!price) return null
                                            const count = selectedFixtures[item] || 0

                                            return (
                                                <div key={item} className={cn(
                                                    "flex items-center justify-between p-2 rounded-md border transition-all",
                                                    count > 0 ? "bg-indigo-500/10 border-indigo-500/30" : "bg-card border-border"
                                                )}>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-foreground font-medium">{t(`fixture.${item}` as any)}</span>
                                                        <span className="text-[10px] text-muted-foreground">₺{price}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 bg-muted rounded p-0.5 border border-border">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedFixtures((prev: Record<string, number>) => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-xs"
                                                            type="button"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-xs font-mono w-4 text-center">{count}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedFixtures((prev: Record<string, number>) => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-xs"
                                                            type="button"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {(!hotel?.settings?.fixture_prices || Object.keys(hotel.settings.fixture_prices).length === 0) && (
                                        <p className="text-xs text-zinc-500 italic mt-2">
                                            {t('notes.noFixturePrices')}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.guestName')}</label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newGuest}
                                        onChange={(e) => setNewGuest(e.target.value)}
                                        className="h-9 text-sm bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('common.staff')}</label>
                                    <Select value={newAssignedStaff} onValueChange={setNewAssignedStaff}>
                                        <SelectTrigger className="w-full text-xs h-9 bg-muted/50 border-border">
                                            <SelectValue placeholder="Assign To..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unassigned</SelectItem>
                                            {staff.map(s => (
                                                <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('module.shiftNotes')}</label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setAIChatTask('report'); setAIChatOpen(true) }}
                                        className="h-6 text-[9px] text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        {t('notes.aiHelp')}
                                    </Button>
                                </div>
                                <Textarea
                                    ref={newContentRef}
                                    placeholder={t('module.shiftNotes') + "..."}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    onContextMenu={newFormatting.handleContextMenu}
                                    className="text-sm bg-muted/50 min-h-[80px]"
                                />
                                <FormattingContextMenu
                                    state={newFormatting.menu}
                                    onClose={newFormatting.closeMenu}
                                    onToggleBullet={newFormatting.toggleBullet}
                                    t={t}
                                />
                            </div>



                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                    disabled={!newContent.trim() || loading}
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
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
                    <p className="text-muted-foreground text-sm text-center py-8">{t('notes.noNotes')}</p>
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
                                        ? 'border-border bg-muted/30'
                                        : 'border-border/30 bg-muted/10 opacity-60'
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
                                                <Badge variant="outline" className="text-[10px] h-4 bg-muted text-muted-foreground border-border">#{note.room_number}</Badge>
                                            )}
                                            {note.guest_name && (
                                                <Badge variant="outline" className="text-[10px] h-4 bg-muted text-muted-foreground border-border flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" />
                                                    {note.guest_name}
                                                </Badge>
                                            )}

                                            {isFinancialCategory(note.category) && note.amount_due && (
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
                                        {editingId === note.id ? (
                                            <div className="space-y-2 mb-2">
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {(Object.keys(categoryInfo) as NoteCategory[]).map((cat) => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setEditCategory(cat)}
                                                            className={cn(
                                                                'text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-all',
                                                                editCategory === cat
                                                                    ? `${categoryInfo[cat].color} text-white`
                                                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                                            )}
                                                        >
                                                            {categoryInfo[cat].icon} {categoryInfo[cat].label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Textarea
                                                        ref={editContentRef}
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onContextMenu={editFormatting.handleContextMenu}
                                                        className="min-h-[80px] text-sm bg-background border-border flex-1"
                                                        autoFocus
                                                    />
                                                    <FormattingContextMenu
                                                        state={editFormatting.menu}
                                                        onClose={editFormatting.closeMenu}
                                                        onToggleBullet={editFormatting.toggleBullet}
                                                        t={t}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Room #"
                                                        value={editRoom}
                                                        onChange={(e) => setEditRoom(e.target.value)}
                                                        className="h-8 w-20 text-sm bg-background border-border"
                                                    />
                                                    <Input
                                                        type="time"
                                                        value={editTime}
                                                        onChange={(e) => setEditTime(e.target.value)}
                                                        className="h-8 w-24 text-sm bg-background border-border"
                                                    />
                                                    {isFinancialCategory(editCategory) && (
                                                        <Input
                                                            type="number"
                                                            placeholder="₺"
                                                            value={editAmount}
                                                            onChange={(e) => setEditAmount(e.target.value)}
                                                            className="h-8 w-20 text-sm bg-background border-border"
                                                        />
                                                    )}
                                                </div>

                                                {/* Fixture Selector for Damage Category (Edit Mode) */}
                                                {editCategory === 'damage' && (
                                                    <div className="p-2 bg-muted/30 rounded border border-border mb-2">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">{t('hotel.settings.fixturePrices')}</label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {FIXTURE_ITEMS.map(item => {
                                                                const price = hotel?.settings?.fixture_prices?.[item]
                                                                if (!price) return null
                                                                const count = editSelectedFixtures[item] || 0

                                                                return (
                                                                    <div key={item} className={cn(
                                                                        "flex items-center justify-between p-1.5 rounded-md border transition-all",
                                                                        count > 0 ? "bg-indigo-500/10 border-indigo-500/30" : "bg-card border-border"
                                                                    )}>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] text-foreground font-medium truncate max-w-[80px]" title={t(`fixture.${item}` as any)}>{t(`fixture.${item}` as any)}</span>
                                                                            <span className="text-[9px] text-muted-foreground">₺{price}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-0.5 bg-muted rounded border border-border">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setEditSelectedFixtures((prev: Record<string, number>) => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-[10px]"
                                                                                type="button"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="text-[10px] font-mono w-3 text-center">{count}</span>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setEditSelectedFixtures((prev: Record<string, number>) => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-[10px]"
                                                                                type="button"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Minibar Selector for Minibar Category (Edit Mode) */}
                                                {editCategory === 'minibar' && (
                                                    <div className="p-2 bg-muted/30 rounded border border-border mb-2">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block tracking-wider">{t('hotel.settings.minibarPrices')}</label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {MINIBAR_ITEMS.map(item => {
                                                                const count = editSelectedMinibar[item] || 0
                                                                const price = hotel?.settings?.minibar_prices?.[item] || 0
                                                                return (
                                                                    <div key={item} className={cn(
                                                                        "flex items-center justify-between p-1.5 rounded-md border transition-all",
                                                                        count > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-card border-border"
                                                                    )}>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[10px] text-foreground font-medium truncate" title={t(`minibar.${item}` as any)}>{t(`minibar.${item}` as any)}</span>
                                                                            <span className="text-[9px] text-muted-foreground">₺{price}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5 bg-muted rounded border border-border">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setEditSelectedMinibar((prev: Record<string, number>) => {
                                                                                        const val = Math.max(0, (prev[item] || 0) - 1)
                                                                                        return { ...prev, [item]: val }
                                                                                    })
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-[10px]"
                                                                                type="button"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="text-[10px] font-mono w-3 text-center">{count}</span>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setEditSelectedMinibar((prev: Record<string, number>) => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded text-[10px]"
                                                                                type="button"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('tours.book.guestName')}</label>
                                                        <Input
                                                            placeholder="Guest Name"
                                                            value={editGuest}
                                                            onChange={(e) => setEditGuest(e.target.value)}
                                                            className="h-8 text-sm bg-background border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('common.staff')}</label>
                                                        <Select value={editAssignedStaff} onValueChange={setEditAssignedStaff}>
                                                            <SelectTrigger className="w-full h-8 text-xs bg-background border-border">
                                                                <SelectValue placeholder="Staff" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Unassigned</SelectItem>
                                                                {staff.map(s => (
                                                                    <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" onClick={handleUpdateNote} disabled={loading} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3">
                                                        {t('common.save')}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs px-3">
                                                        {t('common.cancel')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-foreground mb-2 leading-relaxed">
                                                <TextFormatter text={note.content} />
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                            {/* Author - Hide for non-GMs if feedback */}
                                            {(user?.role === 'gm' || note.category !== 'feedback') && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" />
                                                    {note.is_anonymous ? t('notes.anonymous') : note.created_by_name}
                                                </span>
                                            )}

                                            {/* Time - Hide for non-GMs if feedback */}
                                            {(user?.role === 'gm' || note.category !== 'feedback') && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatDistanceToNow(note.created_at, { addSuffix: true, locale: getDateLocale() })}
                                                    <span className="opacity-50 ml-1">({formatDisplayDateTime(note.created_at)})</span>
                                                    {note.updated_at && note.updated_at.getTime() !== note.created_at.getTime() && (
                                                        <span className="text-muted-foreground ml-1" title={formatDisplayDateTime(note.updated_at)}>
                                                            (edited)
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isFinancialCategory(note.category) && !note.is_paid && note.amount_due && (
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
                                            <SelectTrigger className="h-6 w-24 bg-background border-border text-[10px] px-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active" className="text-xs">{t('status.active')}</SelectItem>
                                                <SelectItem value="resolved" className="text-xs">{t('status.resolved')}</SelectItem>
                                                <SelectItem value="archived" className="text-xs">{t('status.archived')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {user?.role === 'gm' && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleConvertToLog(note.id)}
                                                    className="h-6 w-6 text-indigo-400 hover:bg-indigo-500/10"
                                                    title="Convert to Log"
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(note.id)}
                                                    className="h-6 w-6 text-rose-500 hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEditing(note)}
                                            className="h-6 w-6 text-indigo-400 hover:bg-indigo-500/10"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </CollapsibleCard>
    )
}
