import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale, formatDisplayDateTime, cn } from '@/lib/utils'
import { User, Trash2, Wand2, Pencil, DollarSign, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { TextFormatter } from '@/components/ui/TextFormatter'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { FormattingContextMenu } from '@/components/ui/FormattingContextMenu'
import { useNotesStore, categoryInfo, priorityInfo, type NoteCategory, type NoteStatus, type NotePriority } from '@/stores/notesStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { FIXTURE_ITEMS, MINIBAR_ITEMS } from '@/lib/constants'
import { useFormatting } from '@/hooks/useFormatting'
import type { ShiftNote, StaffMember, Hotel } from '@/types'

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
const isFinancialCategory = (cat: string) => ['damage', 'upgrade', 'payment_needed', 'restaurant', 'minibar'].includes(cat)

interface NoteItemProps {
    note: ShiftNote
    hotelId: string
    hotel: Hotel | null
    staff: StaffMember[]
}

export function NoteItem({ note, hotelId, hotel, staff }: NoteItemProps) {
    const { updateNote, updateNoteStatus, markPaid, deleteNote, convertToLog } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const confirm = useConfirm()

    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    // Edit Form State
    const [editContent, setEditContent] = useState(note.content)
    const [editCategory, setEditCategory] = useState<NoteCategory>(note.category)
    const [editAmount, setEditAmount] = useState(note.amount_due?.toString() || '')
    const [editRoom, setEditRoom] = useState(note.room_number || '')
    const [editTime, setEditTime] = useState(note.time || '')
    const [editGuest, setEditGuest] = useState(note.guest_name || '')
    const [editAssignedStaff, setEditAssignedStaff] = useState(note.assigned_staff_uid || 'none')
    const [editPriority, setEditPriority] = useState<NotePriority>(note.priority || 'low')

    const [editSelectedFixtures, setEditSelectedFixtures] = useState<Record<string, number>>({})
    const [editSelectedMinibar, setEditSelectedMinibar] = useState<Record<string, number>>({})

    const editContentRef = useRef<HTMLTextAreaElement>(null)
    const editFormatting = useFormatting(editContent, setEditContent, editContentRef)

    const getCategoryLabel = (cat: string): string => {
        const keyMap: Record<string, string> = {
            guest_info: 'category.guestInfo',
            early_checkout: 'category.earlyCheckout',
            payment_needed: 'category.paymentNeeded',
        }
        return (t((keyMap[cat] || `category.${cat}`) as any) as string)
    }

    const startEditing = () => {
        setIsEditing(true)
        setEditContent(note.content)
        setEditCategory(note.category)
        setEditAmount(note.amount_due?.toString() || '')
        setEditRoom(note.room_number || '')
        setEditTime(note.time || '')
        setEditGuest(note.guest_name || '')
        setEditAssignedStaff(note.assigned_staff_uid || 'none')
        setEditPriority(note.priority || 'low')

        if (note.category === 'damage') {
            const fixtures: Record<string, number> = {}
            FIXTURE_ITEMS.forEach(item => {
                const itemName = t(`fixture.${item}` as any) as string
                const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

        if (note.category === 'minibar') {
            const minibar: Record<string, number> = {}
            MINIBAR_ITEMS.forEach(item => {
                const itemName = t(`minibar.${item}` as any) as string
                const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
        if (!user) return
        try {
            setLoading(true)
            await updateNote(hotelId, note.id, {
                content: editContent,
                category: editCategory,
                priority: editPriority,
                room_number: editRoom.trim() || null,
                amount_due: isFinancialCategory(editCategory) && editAmount ? parseFloat(editAmount) : null,
                time: editTime || null,
                guest_name: editGuest.trim() || null,
                assigned_staff_uid: (editAssignedStaff && editAssignedStaff !== 'none') ? editAssignedStaff : null,
                assigned_staff_name: (editAssignedStaff && editAssignedStaff !== 'none') ? (staff.find(s => s.uid === editAssignedStaff)?.name || null) : null
            })
            setIsEditing(false)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (status: NoteStatus) => {
        if (!user) return
        await updateNoteStatus(hotelId, note.id, status, user.uid)
    }

    const handleMarkPaid = async () => {
        await markPaid(hotelId, note.id)
    }

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: t('common.deleteConfirm') as string,
            variant: 'destructive',
            confirmLabel: t('common.delete') as string,
        })
        if (confirmed) {
            await deleteNote(hotelId, note.id)
        }
    }

    const handleConvertToLog = async () => {
        const confirmed = await confirm({
            title: 'Convert this note to a system log?',
            confirmLabel: 'Convert',
        })
        if (confirmed) {
            await convertToLog(hotelId, note.id)
        }
    }

    return (
        <motion.div
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
                        {(() => {
                            const catKey = note.category === 'upsell' as any ? 'payment_needed' : note.category
                            const info = categoryInfo[catKey] || categoryInfo.other
                            return (
                                <span className={cn(
                                    'text-xs font-bold uppercase px-2 py-0.5 rounded',
                                    info.color,
                                    'text-white'
                                )}>
                                    {info.icon} {getCategoryLabel(catKey)}
                                </span>
                            )
                        })()}

                        {/* Priority Indicator */}
                        {(() => {
                            const p = note.priority || 'low'
                            if (p === 'low') return null
                            const pInfo = priorityInfo[p]
                            return (
                                <span
                                    className={cn(
                                        pInfo.color,
                                        pInfo.textClass,
                                        pInfo.glowClass,
                                        'leading-none select-none'
                                    )}
                                    title={t(`priority.${p}` as any) as string}
                                >
                                    {pInfo.symbol}
                                </span>
                            )
                        })()}

                        {note.room_number && (
                            <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">#{note.room_number}</Badge>
                        )}
                        {note.guest_name && (
                            <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1 font-medium">
                                <User className="w-3 h-3" />
                                {note.guest_name}
                            </Badge>
                        )}
                        {note.assigned_staff_name && (
                            <Badge variant="outline" className="text-[10px] h-5 py-0 px-1.5 bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 font-medium">
                                <UserAvatar
                                    user={{
                                        id: note.assigned_staff_uid || '',
                                        name: note.assigned_staff_name,
                                        settings: staff.find(s => s.uid === note.assigned_staff_uid)?.settings
                                    } as any}
                                    size="xs"
                                    className="w-3.5 h-3.5 border-none bg-transparent shadow-none"
                                />
                                {note.assigned_staff_name}
                            </Badge>
                        )}

                        {isFinancialCategory(note.category) && note.amount_due && (
                            <span className={cn(
                                'text-sm font-bold',
                                note.is_paid ? 'text-emerald-400' : 'text-rose-400'
                            )}>
                                {CURRENCY_SYMBOLS[note.currency || 'TRY']}{note.amount_due.toLocaleString()}
                                {note.is_paid && ' ✓'}
                            </span>
                        )}

                        <Badge variant="outline" className={cn(
                            "text-xs h-5 px-1.5 border-none font-semibold",
                            note.status === 'active' ? "text-emerald-500 bg-emerald-500/10" :
                                note.status === 'resolved' ? "text-indigo-500 bg-indigo-500/10" :
                                    "text-zinc-500 bg-zinc-500/10"
                        )}>
                            {(t(`status.${note.status}` as any) as string).toUpperCase()}
                        </Badge>
                    </div>

                    {/* Content */}
                    {isEditing ? (
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
                                        {categoryInfo[cat].icon} {getCategoryLabel(cat)}
                                    </button>
                                ))}
                            </div>

                            {/* Priority Selection (Edit) */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">{t('priority.label')}:</span>
                                {(Object.keys(priorityInfo) as NotePriority[]).map((p) => {
                                    const pInfo = priorityInfo[p]
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setEditPriority(p)}
                                            className={cn(
                                                'px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all border',
                                                editPriority === p
                                                    ? `${pInfo.color} ${pInfo.textClass} ${pInfo.glowClass} border-current bg-current/10`
                                                    : 'text-muted-foreground border-transparent hover:bg-muted'
                                            )}
                                            title={t(`priority.${p}` as any) as string}
                                        >
                                            <span className={cn(pInfo.textClass, editPriority === p ? pInfo.color : '')}>{pInfo.symbol}</span>
                                            <span className="text-[10px]">{t(`priority.${p}` as any) as string}</span>
                                        </button>
                                    )
                                })}
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
                                                        <span className="text-[10px] text-foreground font-medium truncate max-w-[80px]" title={t(`fixture.${item}` as any) as string}>{t(`fixture.${item}` as any) as string}</span>
                                                        <span className="text-[9px] text-muted-foreground">₺{price}</span>
                                                    </div>

                                                    <div className="flex items-center gap-0.5 bg-muted rounded border border-border">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setEditSelectedFixtures(prev => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))
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
                                                                setEditSelectedFixtures(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
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
                                                        <span className="text-[10px] text-foreground font-medium truncate" title={t(`minibar.${item}` as any) as string}>{t(`minibar.${item}` as any) as string}</span>
                                                        <span className="text-[9px] text-muted-foreground">₺{price}</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 bg-muted rounded border border-border">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setEditSelectedMinibar(prev => {
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
                                                                setEditSelectedMinibar(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }))
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
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs px-3">
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
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {(user?.role === 'gm' || note.category !== 'feedback') && (
                            <span className="flex items-center gap-1.5">
                                {!note.is_anonymous && (
                                    <UserAvatar
                                        user={{
                                            id: note.created_by,
                                            name: note.created_by_name,
                                            settings: staff.find(s => s.uid === note.created_by)?.settings
                                        } as any}
                                        size="xs"
                                        className="w-4 h-4 border-none bg-transparent shadow-none"
                                    />
                                )}
                                {note.is_anonymous ? (
                                    <>
                                        <User className="w-3.5 h-3.5" />
                                        {t('notes.anonymous') as string}
                                    </>
                                ) : note.created_by_name}
                            </span>
                        )}

                        {(user?.role === 'gm' || note.category !== 'feedback') && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDistanceToNow(note.created_at, { addSuffix: true, locale: getDateLocale() })}
                                <span className="opacity-50 ml-1">({formatDisplayDateTime(note.created_at)})</span>
                                {note.updated_at && note.updated_at.getTime() !== note.created_at.getTime() && (
                                    <span className="text-muted-foreground ml-1" title={formatDisplayDateTime(note.updated_at)}>
                                        ({(t('common.edited') as string) || 'edited'})
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isFinancialCategory(note.category) && !note.is_paid && note.amount_due && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleMarkPaid}
                            className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                        >
                            <DollarSign className="w-4 h-4" />
                        </Button>
                    )}

                    <Select
                        value={note.status}
                        onValueChange={(v) => handleStatusChange(v as NoteStatus)}
                    >
                        <SelectTrigger className="h-8 w-28 bg-background border-border text-xs px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active" className="text-xs">{t('status.active') as string}</SelectItem>
                            <SelectItem value="resolved" className="text-xs">{t('status.resolved') as string}</SelectItem>
                            <SelectItem value="archived" className="text-xs">{t('status.archived') as string}</SelectItem>
                        </SelectContent>
                    </Select>

                    {user?.role === 'gm' && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleConvertToLog}
                                className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10"
                                title="Convert to Log"
                            >
                                <Wand2 className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleDelete}
                                className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={startEditing}
                        className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
