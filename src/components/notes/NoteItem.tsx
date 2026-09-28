import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale, formatDisplayDateTime, cn } from '@/lib/utils'
import { User, Trash2, Wand2, Pencil, DollarSign, Clock, Pin, PinOff, History, Ticket, RotateCcw } from 'lucide-react'
import { NoteHistoryModal } from './NoteHistoryModal'
import { VoucherPreviewModal } from '../sales/VoucherPreviewModal'
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
    selected?: boolean
    onToggleSelect?: () => void
}

export function NoteItem({ note, hotelId, hotel, staff, selected, onToggleSelect }: NoteItemProps) {
    const { updateNote, updateNoteStatus, markPaid, markUnpaid, deleteNote, convertToLog, togglePin } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const confirm = useConfirm()

    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showVoucher, setShowVoucher] = useState(false)

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

    const handleMarkUnpaid = async () => {
        await markUnpaid(hotelId, note.id)
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
            title: t('notes.convertConfirm') as string,
            confirmLabel: t('notes.convertConfirmAction') as string,
        })
        if (confirmed) {
            await convertToLog(hotelId, note.id)
        }
    }

    const handleTogglePin = async () => {
        await togglePin(hotelId, note.id, !note.is_pinned)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                'handover-note p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group relative shadow-xs hover:border-primary/40 hover:shadow-md space-y-2.5',
                note.is_pinned
                    ? 'border-l-4 border-l-primary border-y-border/70 border-r-border/70 bg-primary/[0.04]'
                    : note.status === 'active'
                        ? 'border-border/70 bg-card/90 hover:bg-card'
                        : 'border-border/40 bg-muted/20 opacity-65 hover:opacity-100',
            )}
        >
            {/* ROW 1: Checkbox, Category, Priority, Room & Status Select */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/40 pb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {onToggleSelect && (
                        <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={(e) => {
                                e.stopPropagation()
                                onToggleSelect()
                            }}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                    )}
                    {(() => {
                        const catKey = note.category === 'upsell' as any ? 'payment_needed' : note.category
                        const info = categoryInfo[catKey] || categoryInfo.other
                        return (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-border/50 bg-muted/50 text-foreground shrink-0">
                                <span className={cn('w-2 h-2 rounded-full shrink-0', info.color)} aria-hidden="true" />
                                {getCategoryLabel(catKey)}
                            </span>
                        )
                    })()}

                    {(() => {
                        const p = note.priority || 'low'
                        if (p === 'low') return null
                        const pInfo = priorityInfo[p]
                        return (
                            <span
                                className={cn('inline-flex items-center gap-1 py-0.5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0',
                                    p === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                        p === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                )}
                                title={t(`priority.${p}` as any) as string}
                            >
                                <span className={cn('w-1.5 h-1.5 rounded-full', pInfo.color.replace('text-', 'bg-'))} aria-hidden="true" />
                                {t(`priority.${p}` as any) as string}
                            </span>
                        )
                    })()}

                    {note.room_number && (
                        <Badge variant="outline" className="text-xs h-6 py-0 px-2 bg-muted/60 text-foreground border-border/50 font-mono font-bold shrink-0">#{note.room_number}</Badge>
                    )}
                </div>

                <div className="shrink-0 ml-auto">
                    <Select
                        value={note.status}
                        onValueChange={(v) => handleStatusChange(v as NoteStatus)}
                    >
                        <SelectTrigger className={cn(
                            "h-7 px-2.5 border font-semibold text-xs gap-1.5 focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors rounded-lg",
                            note.status === 'active' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                                note.status === 'resolved' ? "text-primary bg-primary/10 border-primary/30" :
                                    "text-muted-foreground bg-muted/40 border-border/40"
                        )}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border min-w-[120px]">
                            <SelectItem value="active" className="text-xs">{t('status.active') as string}</SelectItem>
                            <SelectItem value="resolved" className="text-xs">{t('status.resolved') as string}</SelectItem>
                            <SelectItem value="archived" className="text-xs">{t('status.archived') as string}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ROW 2: Guest, Staff, Amount & Voucher Badges */}
            {(note.guest_name || note.assigned_staff_name || (isFinancialCategory(note.category) && note.amount_due) || note.sale_id) && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                    {note.guest_name && (
                        <Badge variant="outline" className="text-xs h-6 py-0 px-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1 font-medium shrink-0">
                            <User className="w-3 h-3" />
                            {note.guest_name}
                        </Badge>
                    )}
                    {note.assigned_staff_name && (
                        <Badge variant="outline" className="text-xs h-6 py-0 px-2 bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 font-medium shrink-0">
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
                            'text-xs font-bold px-2 py-0.5 rounded-md border shrink-0',
                            note.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}>
                            {CURRENCY_SYMBOLS[note.currency || 'TRY']}{note.amount_due.toLocaleString()}
                            {note.is_paid && ' ✓'}
                        </span>
                    )}
                    {note.sale_id && (
                        <Badge 
                            variant="outline" 
                            className="text-xs h-6 py-0 px-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 flex items-center gap-1 font-medium cursor-pointer hover:bg-indigo-500/20 transition-colors shrink-0"
                            onClick={(e) => { e.stopPropagation(); setShowVoucher(true); }}
                        >
                            <Ticket className="w-3 h-3" />
                            Voucher
                        </Badge>
                    )}
                </div>
            )}

            {/* ROW 3: Note Body Content */}
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
                            placeholder={(t('common.room') as string) + ' #'}
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
                                placeholder={t('notes.guestName') as string}
                                value={editGuest}
                                onChange={(e) => setEditGuest(e.target.value)}
                                className="h-8 text-sm bg-background border-border"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground font-bold uppercase">{t('common.staff')}</label>
                            <Select value={editAssignedStaff} onValueChange={setEditAssignedStaff}>
                                <SelectTrigger className="w-full h-8 text-xs bg-background border-border">
                                    <SelectValue placeholder={t('common.staff') as string} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='none'>{t('notes.unassigned') as string}</SelectItem>
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
                <div className="text-sm text-foreground leading-relaxed font-normal py-0.5">
                    <TextFormatter text={note.content} />
                </div>
            )}

            {/* ROW 4: Footer Meta on Left, Action Toolbar on Right */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    {(user?.role === 'gm' || note.category !== 'feedback') && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                            {!note.is_anonymous && (
                                <UserAvatar
                                    user={{
                                        id: note.created_by,
                                        name: note.created_by_name,
                                        settings: staff.find(s => s.uid === note.created_by)?.settings
                                    } as any}
                                    size="sm"
                                    className="w-4 h-4 border-none bg-transparent shadow-none"
                                />
                            )}
                            {note.is_anonymous ? (
                                <>
                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    {t('notes.anonymous') as string}
                                </>
                            ) : note.created_by_name}
                        </span>
                    )}

                    {(user?.role === 'gm' || note.category !== 'feedback') && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground" title={formatDisplayDateTime(note.created_at)}>
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>{formatDistanceToNow(note.created_at, { addSuffix: true, locale: getDateLocale() })}</span>
                            {note.updated_at && note.updated_at.getTime() !== note.created_at.getTime() && (
                                user?.role === 'gm' ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowHistory(true)}
                                        className="text-amber-500 text-xs hover:underline hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                                        title={t('notes.history.button') as string}
                                    >
                                        <History className="w-3 h-3" />
                                        · {(t('common.edited') as string) || 'edited'}
                                        {note.edit_history && note.edit_history.length > 0 && (
                                            <span className="text-[10px] opacity-70">({note.edit_history.length})</span>
                                        )}
                                    </button>
                                ) : (
                                    <span className="text-amber-500 text-xs" title={formatDisplayDateTime(note.updated_at)}>
                                        · {(t('common.edited') as string) || 'edited'}
                                    </span>
                                )
                            )}
                        </span>
                    )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleTogglePin}
                        className={cn(
                            "h-7 w-7 rounded-lg transition-colors",
                            note.is_pinned ? "text-primary bg-primary/15 border border-primary/30" : "text-muted-foreground hover:bg-muted"
                        )}
                        title={note.is_pinned ? (t('notes.unpin') as string) : (t('notes.pin') as string)}
                        aria-label={note.is_pinned ? (t('notes.unpin') as string) : (t('notes.pin') as string)}
                    >
                        {note.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </Button>
                    {isFinancialCategory(note.category) && (
                        note.is_paid ? (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleMarkUnpaid}
                                className="h-7 w-7 rounded-lg text-amber-400 hover:bg-amber-500/10"
                                title="Ödemeyi Geri Al (Ödenmedi Yap)"
                                aria-label="Ödemeyi Geri Al"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        ) : note.amount_due ? (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleMarkPaid}
                                className="h-7 w-7 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                title="Ödeme Alındı İşaretle"
                                aria-label="Ödeme Alındı"
                            >
                                <DollarSign className="w-3.5 h-3.5" />
                            </Button>
                        ) : null
                    )}

                    {user?.role === 'gm' && (
                        <>
                            {note.edit_history && note.edit_history.length > 0 && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setShowHistory(true)}
                                    className="h-7 w-7 rounded-lg text-amber-500 hover:bg-amber-500/10 relative"
                                    title={t('notes.history.button') as string}
                                    aria-label={t('notes.history.button') as string}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-amber-950 flex items-center justify-center leading-none">
                                        {note.edit_history.length}
                                    </span>
                                </Button>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleConvertToLog}
                                className="h-7 w-7 rounded-lg text-indigo-400 hover:bg-indigo-500/10"
                                title={t('notes.convertToLog') as string}
                                aria-label={t('notes.convertToLog') as string}
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleDelete}
                                className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={startEditing}
                        className="h-7 w-7 rounded-lg text-indigo-400 hover:bg-indigo-500/10"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {showHistory && (
                <NoteHistoryModal
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    note={note}
                    staff={staff}
                />
            )}
            
            {showVoucher && note.sale_id && (
                <VoucherPreviewModal
                    saleId={note.sale_id}
                    onClose={() => setShowVoucher(false)}
                />
            )}
        </motion.div>
    )
}
