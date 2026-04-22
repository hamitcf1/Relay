import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useNotesStore, categoryInfo, priorityInfo, type NoteCategory, type NotePriority } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'
import { useFormatting } from '@/hooks/useFormatting'
import { FormattingContextMenu } from '@/components/ui/FormattingContextMenu'
import { FIXTURE_ITEMS, MINIBAR_ITEMS } from '@/lib/constants'
import type { Hotel, StaffMember } from '@/types'

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }

interface NoteFormProps {
    hotelId: string
    hotel: Hotel | null
    staff: StaffMember[]
    onCancel: () => void
}

export function NoteForm({ hotelId, hotel, staff, onCancel }: NoteFormProps) {
    const { addNote } = useNotesStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const [newCategory, setNewCategory] = useState<NoteCategory>('handover')
    const [newContent, setNewContent] = useState('')
    const [newRoom, setNewRoom] = useState('')
    const [newAmount, setNewAmount] = useState('')
    const [newTime, setNewTime] = useState('')
    const [newGuest, setNewGuest] = useState('')
    const [newAssignedStaff, setNewAssignedStaff] = useState<string>('')
    const [newCurrency, setNewCurrency] = useState<'TRY' | 'USD' | 'EUR' | 'GBP'>('TRY')
    const [newPriority, setNewPriority] = useState<NotePriority>('low')
    const [loading, setLoading] = useState(false)

    const newContentRef = useRef<HTMLTextAreaElement>(null)
    const newFormatting = useFormatting(newContent, setNewContent, newContentRef)

    const [selectedFixtures, setSelectedFixtures] = useState<Record<string, number>>({})
    const [selectedMinibar, setSelectedMinibar] = useState<Record<string, number>>({})

    const isFinancialCategory = (cat: string) => ['damage', 'upgrade', 'payment_needed', 'restaurant', 'minibar'].includes(cat)

    const getCategoryLabel = (cat: string): string => {
        const keyMap: Record<string, string> = {
            guest_info: 'category.guestInfo',
            early_checkout: 'category.earlyCheckout',
            payment_needed: 'category.paymentNeeded',
        }
        return (t((keyMap[cat] || `category.${cat}`) as any) as string)
    }

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
                priority: newPriority,
                content: newContent.trim(),
                room_number: newRoom.trim() || null,
                is_relevant: true,
                amount_due: isFinancialCategory(newCategory) && newAmount ? parseFloat(newAmount) : null,
                is_paid: false,
                currency: isFinancialCategory(newCategory) ? newCurrency : undefined,
                created_by: user.uid,
                created_by_name: user.name || 'Unknown',
                shift_id: null,
                time: newTime || null,
                guest_name: newGuest.trim() || null,
                assigned_staff_uid: (newAssignedStaff && newAssignedStaff !== 'none') ? newAssignedStaff : null,
                assigned_staff_name: (newAssignedStaff && newAssignedStaff !== 'none') ? (staff.find(s => s.uid === newAssignedStaff)?.name || null) : null
            })

            // Reset form completely handled by unmounting or passing to parent
            onCancel()
        } finally {
            setLoading(false)
        }
    }

    return (
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
                        {getCategoryLabel(cat)}
                    </button>
                ))}
            </div>

            {/* Priority Selection */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{t('priority.label')}:</span>
                {(Object.keys(priorityInfo) as NotePriority[]).map((p) => {
                    const info = priorityInfo[p]
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setNewPriority(p)}
                            className={cn(
                                'px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all border',
                                newPriority === p
                                    ? `${info.color} ${info.textClass} ${info.glowClass} border-current bg-current/10`
                                    : 'text-muted-foreground border-transparent hover:bg-muted'
                            )}
                            title={t(`priority.${p}` as any) as string}
                        >
                            <span className={cn(info.textClass, newPriority === p ? info.color : '')}>
                                {info.symbol}
                            </span>
                            <span className="text-[10px]">{t(`priority.${p}` as any) as string}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder={(t('common.room') as string) + " #"}
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
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    const menu = e.currentTarget.nextElementSibling as HTMLElement
                                    if (menu) menu.classList.toggle('hidden')
                                }}
                                className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 text-sm text-foreground hover:bg-muted transition-colors min-w-[80px]"
                            >
                                <span className="font-medium">{CURRENCY_SYMBOLS[newCurrency]}</span>
                                <span>{newCurrency}</span>
                                <svg className="w-3 h-3 ml-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div className="hidden absolute top-full left-0 mt-1 z-50 min-w-[100px] rounded-lg border border-border bg-card shadow-xl py-1">
                                {(['TRY', 'USD', 'EUR', 'GBP'] as const).map(cur => (
                                    <button
                                        key={cur}
                                        type="button"
                                        onClick={(e) => {
                                            setNewCurrency(cur)
                                            const menu = e.currentTarget.parentElement as HTMLElement
                                            if (menu) menu.classList.add('hidden')
                                        }}
                                        className={cn(
                                            'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                                            newCurrency === cur ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                                        )}
                                    >
                                        <span className="font-medium w-4">{CURRENCY_SYMBOLS[cur]}</span>
                                        <span>{cur}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Input
                            placeholder={t('common.amount') as string}
                            type="number"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-28 text-sm bg-muted/50"
                        />
                    </div>
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
                                        <span className="text-[10px] text-foreground font-medium truncate">{t(`minibar.${item}` as any) as string}</span>
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
                                        <span className="text-xs text-foreground font-medium">{t(`fixture.${item}` as any) as string}</span>
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
                </div>
                <Textarea
                    ref={newContentRef}
                    placeholder={(t('module.shiftNotes') as string) + "..."}
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
                    onClick={onCancel}
                >
                    {t('common.cancel')}
                </Button>
            </div>
        </motion.div>
    )
}
