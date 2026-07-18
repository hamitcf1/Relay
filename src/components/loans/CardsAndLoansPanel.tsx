import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    KeyRound,
    Package,
    Plus,
    Minus,
    RotateCcw,
    Sparkles,
    Search,
    Filter,
} from 'lucide-react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import type { LoanItemPreset, Room } from '@/types'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'

const LOAN_ITEMS: LoanItemPreset[] = [
    'charger',
    'usb_cable',
    'adapter',
    'scissors',
    'stapler',
    'hair_dryer',
    'iron',
    'extra_blanket',
    'extra_pillow',
    'extra_towel',
    'umbrella',
    'other',
]

export function CardsAndLoansPanel() {
    const { hotel } = useHotelStore()
    const hotelId = hotel?.id
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const {
        rooms,
        subscribeToRooms,
        setKeyCardCount,
        addLoan,
        returnLoan,
        resetRoomBorrowables,
    } = useRoomStore()

    const [search, setSearch] = useState('')
    const [onlyWithItems, setOnlyWithItems] = useState(true)
    // Per-room inline-add form draft state — keyed by room id
    const [drafts, setDrafts] = useState<Record<string, { item: LoanItemPreset; qty: number; label: string }>>({})
    const [busyRoomId, setBusyRoomId] = useState<string | null>(null)

    useEffect(() => {
        if (hotelId) return subscribeToRooms(hotelId)
    }, [hotelId])

    const stats = useMemo(() => {
        let roomsWithItems = 0
        let totalCards = 0
        let totalItems = 0
        for (const r of rooms) {
            const cards = r.key_card_count ?? 0
            const loans = r.active_loans ?? []
            const loanQty = loans.reduce((s, l) => s + l.qty, 0)
            if (cards > 0 || loans.length > 0) roomsWithItems++
            totalCards += cards
            totalItems += loanQty
        }
        return { roomsWithItems, totalCards, totalItems }
    }, [rooms])

    const filtered = useMemo(() => {
        return rooms
            .filter(r => {
                if (search && !r.number.toLowerCase().includes(search.toLowerCase())) return false
                if (onlyWithItems) {
                    const hasItems = (r.key_card_count ?? 0) > 0 || (r.active_loans ?? []).length > 0
                    if (!hasItems) return false
                }
                return true
            })
    }, [rooms, search, onlyWithItems])

    const getDraft = (roomId: string) =>
        drafts[roomId] ?? { item: 'charger' as LoanItemPreset, qty: 1, label: '' }

    const updateDraft = (roomId: string, patch: Partial<{ item: LoanItemPreset; qty: number; label: string }>) => {
        setDrafts(prev => ({ ...prev, [roomId]: { ...getDraft(roomId), ...patch } }))
    }

    const handleAdd = async (room: Room) => {
        if (!hotelId) return
        const draft = getDraft(room.id)
        setBusyRoomId(room.id)
        try {
            await addLoan(hotelId, room.id, {
                item: draft.item,
                label: draft.label.trim() || undefined,
                qty: draft.qty,
                lent_by: user?.uid,
                lent_by_name: user?.name,
            })
            // Reset draft for this room
            setDrafts(prev => ({ ...prev, [room.id]: { item: 'charger', qty: 1, label: '' } }))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyRoomId(null)
        }
    }

    const handleReturn = async (roomId: string, loanId: string) => {
        if (!hotelId) return
        try {
            await returnLoan(hotelId, roomId, loanId, user?.name)
        } catch (err) {
            console.error(err)
        }
    }

    const handleClearAll = async (roomId: string) => {
        if (!hotelId) return
        if (!window.confirm(t('loans.confirmReturnAll'))) return
        try {
            await resetRoomBorrowables(hotelId, roomId)
        } catch (err) {
            console.error(err)
        }
    }

    const bumpCards = async (room: Room, delta: number) => {
        if (!hotelId) return
        const next = Math.max(0, Math.min(9, (room.key_card_count ?? 0) + delta))
        if (next === (room.key_card_count ?? 0)) return
        try {
            await setKeyCardCount(hotelId, room.id, next)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="relative flex flex-col gap-5 bg-background/50 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-amber-500" />
                        {t('loans.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('loans.panelSubtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <StatChip
                        icon={<KeyRound className="w-4 h-4" />}
                        label={t('loans.stat.cards')}
                        value={stats.totalCards}
                        accent="amber"
                    />
                    <StatChip
                        icon={<Package className="w-4 h-4" />}
                        label={t('loans.stat.items')}
                        value={stats.totalItems}
                        accent="primary"
                    />
                    <StatChip
                        icon={<Filter className="w-4 h-4" />}
                        label={t('loans.stat.rooms')}
                        value={stats.roomsWithItems}
                        accent="muted"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-xl border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder={t('loans.searchRoom')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-background border-border rounded-full"
                    />
                </div>
                <Button
                    variant={onlyWithItems ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOnlyWithItems(v => !v)}
                    className={cn(
                        'rounded-full h-10 px-4 gap-2',
                        onlyWithItems
                            ? 'bg-amber-500 hover:bg-amber-500/90 text-amber-950'
                            : 'border-border'
                    )}
                >
                    <Filter className="w-4 h-4" />
                    {onlyWithItems ? t('loans.filter.onlyActive') : t('loans.filter.showAll')}
                </Button>
            </div>

            {/* Rooms list */}
            <div className="flex flex-col gap-3">
                <AnimatePresence>
                    {filtered.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-16 text-muted-foreground"
                        >
                            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">
                                {onlyWithItems ? t('loans.summary.empty') : t('loans.empty.search')}
                            </p>
                        </motion.div>
                    )}
                    {filtered.map(room => {
                        const cards = room.key_card_count ?? 0
                        const loans = room.active_loans ?? []
                        const hasItems = cards > 0 || loans.length > 0
                        const draft = getDraft(room.id)
                        return (
                            <motion.div
                                key={room.id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className={cn(
                                    'rounded-xl border bg-card transition-colors',
                                    hasItems ? 'border-amber-500/40' : 'border-border'
                                )}
                            >
                                {/* Row header */}
                                <div className="flex items-center gap-4 p-4 flex-wrap">
                                    <div className="flex items-center gap-3 min-w-[140px]">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold tracking-tight',
                                            room.occupancy === 'occupied'
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        )}>
                                            {room.number}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                                {room.occupancy === 'occupied' ? t('rooms.occupied') : t('rooms.vacant')}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {t(`rooms.${room.status}` as any)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cards control */}
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:block">
                                            {t('loans.keyCards')}
                                        </div>
                                        <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-full px-1.5 py-1">
                                            <button
                                                onClick={() => bumpCards(room, -1)}
                                                disabled={cards <= 0}
                                                className="w-7 h-7 rounded-full hover:bg-muted disabled:opacity-30 transition-colors flex items-center justify-center"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold tabular-nums flex items-center justify-center gap-1">
                                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                                {cards}
                                            </span>
                                            <button
                                                onClick={() => bumpCards(room, +1)}
                                                disabled={cards >= 9}
                                                className="w-7 h-7 rounded-full hover:bg-muted disabled:opacity-30 transition-colors flex items-center justify-center"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right-aligned clear-all */}
                                    {hasItems && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleClearAll(room.id)}
                                            className="text-emerald-500 hover:bg-emerald-500/10 ml-auto rounded-full"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                                            {t('loans.checkout.clear')}
                                        </Button>
                                    )}
                                </div>

                                {/* Loans list */}
                                {loans.length > 0 && (
                                    <div className="px-4 pb-3 space-y-1.5">
                                        {loans.map(loan => {
                                            const lentDate = loan.lent_at instanceof Date
                                                ? loan.lent_at
                                                : new Date(loan.lent_at as any)
                                            return (
                                                <div
                                                    key={loan.id}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/60"
                                                >
                                                    <Package className="w-4 h-4 text-primary shrink-0" />
                                                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold">
                                                            {t(`loans.item.${loan.item}` as any)}
                                                        </span>
                                                        {loan.qty > 1 && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                                x{loan.qty}
                                                            </span>
                                                        )}
                                                        {loan.label && (
                                                            <span className="text-[11px] text-muted-foreground italic truncate">
                                                                · {loan.label}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground ml-auto sm:ml-2">
                                                            {formatDistanceToNowStrict(lentDate)} · {format(lentDate, 'HH:mm')}
                                                            {loan.lent_by_name && ` · ${loan.lent_by_name}`}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleReturn(room.id, loan.id)}
                                                        className="rounded-lg border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 h-7 px-2.5"
                                                    >
                                                        <RotateCcw className="w-3 h-3 mr-1" />
                                                        {t('loans.return')}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Inline add */}
                                <div className="px-4 pb-4 pt-1 border-t border-border/40">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3">
                                        <Select
                                            value={draft.item}
                                            onValueChange={(v) => updateDraft(room.id, { item: v as LoanItemPreset })}
                                        >
                                            <SelectTrigger className="h-9 bg-muted/30 border-border rounded-lg text-xs flex-1 min-w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {LOAN_ITEMS.map(item => (
                                                    <SelectItem key={item} value={item} className="text-xs">
                                                        {t(`loans.item.${item}` as any)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-lg px-1.5 h-9">
                                            <button
                                                type="button"
                                                onClick={() => updateDraft(room.id, { qty: Math.max(1, draft.qty - 1) })}
                                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-5 text-center text-xs font-bold tabular-nums">{draft.qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateDraft(room.id, { qty: Math.min(20, draft.qty + 1) })}
                                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <Input
                                            placeholder={t('loans.notePlaceholder')}
                                            value={draft.label}
                                            onChange={(e) => updateDraft(room.id, { label: e.target.value })}
                                            className="h-9 bg-muted/30 border-border rounded-lg text-xs flex-1 min-w-[140px]"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleAdd(room)}
                                            disabled={busyRoomId === room.id}
                                            className="h-9 rounded-lg bg-primary hover:bg-primary/90 shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            {busyRoomId === room.id ? t('loans.adding') : t('loans.lendItem')}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
            <ScrollToTopButton />
        </div>
    )
}

function StatChip({
    icon,
    label,
    value,
    accent,
}: {
    icon: React.ReactNode
    label: string
    value: number
    accent: 'amber' | 'primary' | 'muted'
}) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold',
                accent === 'amber' && 'bg-amber-500/10 border-amber-500/30 text-amber-500',
                accent === 'primary' && 'bg-primary/10 border-primary/30 text-primary',
                accent === 'muted' && 'bg-muted border-border text-muted-foreground'
            )}
        >
            {icon}
            <span className="hidden sm:inline">{label}:</span>
            <span className="tabular-nums">{value}</span>
        </div>
    )
}
