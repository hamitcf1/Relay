import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Minus, Plus, Package, X, RotateCcw, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import type { Room, LoanItemPreset } from '@/types'

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

interface LoanModalProps {
    isOpen: boolean
    onClose: () => void
    room: Room | null
    hotelId: string
}

export function LoanModal({ isOpen, onClose, room, hotelId }: LoanModalProps) {
    const { setKeyCardCount, addLoan, returnLoan, resetRoomBorrowables } = useRoomStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const [newItem, setNewItem] = useState<LoanItemPreset>('charger')
    const [newQty, setNewQty] = useState(1)
    const [newLabel, setNewLabel] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [returningId, setReturningId] = useState<string | null>(null)

    if (!isOpen || !room) return null

    const keyCardCount = room.key_card_count ?? 0
    const activeLoans = room.active_loans ?? []
    const hasAnything = keyCardCount > 0 || activeLoans.length > 0

    const updateKeyCards = async (next: number) => {
        if (!hotelId || next < 0 || next > 9) return
        try {
            await setKeyCardCount(hotelId, room.id, next)
        } catch (err) {
            console.error(err)
        }
    }

    const handleAdd = async () => {
        if (!hotelId) return
        setSubmitting(true)
        try {
            await addLoan(hotelId, room.id, {
                item: newItem,
                label: newLabel.trim() || undefined,
                qty: newQty,
                lent_by: user?.uid,
                lent_by_name: user?.name,
            })
            setNewItem('charger')
            setNewQty(1)
            setNewLabel('')
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleReturn = async (loanId: string) => {
        if (!hotelId) return
        setReturningId(loanId)
        try {
            await returnLoan(hotelId, room.id, loanId, user?.name)
        } catch (err) {
            console.error(err)
        } finally {
            setReturningId(null)
        }
    }

    const handleClearAll = async () => {
        if (!hotelId) return
        if (!window.confirm(t('loans.confirmReturnAll'))) return
        try {
            await resetRoomBorrowables(hotelId, room.id)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="p-6 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold tracking-tight">{t('loans.title')}</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {t('loans.roomLabel')} {room.number}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Key Cards */}
                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                {t('loans.extraKeyCards')}
                            </label>
                            <span className="text-[10px] text-muted-foreground italic">
                                {t('loans.keyCardsHint')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateKeyCards(keyCardCount - 1)}
                                disabled={keyCardCount <= 0}
                                className="rounded-full h-10 w-10 shrink-0"
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <div className="flex-1 flex items-center justify-center gap-2">
                                <KeyRound className="w-5 h-5 text-amber-500" />
                                <span className="text-3xl font-bold tabular-nums">{keyCardCount}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateKeyCards(keyCardCount + 1)}
                                disabled={keyCardCount >= 9}
                                className="rounded-full h-10 w-10 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </section>

                    {/* Active Loans */}
                    <section className="space-y-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                            {t('loans.activeLoans')}
                        </label>
                        {activeLoans.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center text-xs text-muted-foreground italic">
                                {t('loans.noActive')}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeLoans.map((loan) => {
                                    const lentDate = loan.lent_at instanceof Date
                                        ? loan.lent_at
                                        : new Date(loan.lent_at as any)
                                    return (
                                        <div
                                            key={loan.id}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
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
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    {t('loans.lentAt')} {format(lentDate, 'd MMM HH:mm')}
                                                    {loan.lent_by_name && ` ${t('loans.lentBy')} ${loan.lent_by_name}`}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReturn(loan.id)}
                                                disabled={returningId === loan.id}
                                                className={cn(
                                                    'shrink-0 rounded-xl border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10',
                                                    returningId === loan.id && 'opacity-60'
                                                )}
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                                {returningId === loan.id ? t('loans.returning') : t('loans.return')}
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* Add New */}
                    <section className="space-y-2 pt-2 border-t border-border/40">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                            {t('loans.addNew')}
                        </label>
                        <div className="grid grid-cols-[1fr_auto] gap-3">
                            <Select value={newItem} onValueChange={(v) => setNewItem(v as LoanItemPreset)}>
                                <SelectTrigger className="h-11 bg-muted/30 border-border rounded-xl text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {LOAN_ITEMS.map((item) => (
                                        <SelectItem key={item} value={item} className="text-sm">
                                            {t(`loans.item.${item}` as any)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-xl px-2 h-11">
                                <button
                                    type="button"
                                    onClick={() => setNewQty(Math.max(1, newQty - 1))}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold tabular-nums">{newQty}</span>
                                <button
                                    type="button"
                                    onClick={() => setNewQty(Math.min(20, newQty + 1))}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <Input
                            placeholder={t('loans.notePlaceholder')}
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="h-11 bg-muted/30 border-border rounded-xl text-sm"
                        />
                        <Button
                            onClick={handleAdd}
                            disabled={submitting}
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-1"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            {submitting ? t('loans.adding') : t('loans.lendItem')}
                        </Button>
                    </section>
                </div>

                <div className="p-4 bg-muted/10 border-t border-border/40 flex gap-3 shrink-0">
                    {hasAnything && (
                        <Button
                            variant="ghost"
                            onClick={handleClearAll}
                            className="flex-1 rounded-xl text-emerald-500 hover:bg-emerald-500/10"
                        >
                            <Sparkles className="w-4 h-4 mr-1" />
                            {t('loans.checkout.clear')}
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
                        {t('common.close') as any}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
