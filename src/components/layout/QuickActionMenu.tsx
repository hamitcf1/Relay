import { useEffect, useRef } from 'react'
import { CalendarPlus, MessageCircle, ReceiptText, ShieldAlert, X, ArrowLeftRight } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { normalizeNavigationConfig } from '@/lib/navigationDefaults'

interface QuickActionMenuProps {
    onAction: (id: 'notes' | 'feedback' | 'sales' | 'messaging' | 'calendar') => void
}

export function QuickActionMenu({ onAction }: QuickActionMenuProps) {
    const { quickActionsOpen, closeQuickActions } = useNavigationStore()
    const { language } = useLanguageStore()
    const navigationConfig = useHotelStore((state) => state.hotel?.settings.navigation)
    const closeRef = useRef<HTMLButtonElement>(null)
    useEffect(() => {
        if (!quickActionsOpen) return
        closeRef.current?.focus()
        const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && closeQuickActions()
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [closeQuickActions, quickActionsOpen])
    if (!quickActionsOpen) return null

    const labels = language === 'tr'
        ? { title: 'Hızlı kayıt', close: 'Kapat', notes: 'Vardiya notu', feedback: 'Şikâyet', sales: 'Satış', messaging: 'Mesaj', calendar: 'Takvim kaydı' }
        : language === 'ru'
            ? { title: 'Быстрое действие', close: 'Закрыть', notes: 'Запись смены', feedback: 'Жалоба', sales: 'Продажа', messaging: 'Сообщение', calendar: 'Календарь' }
            : { title: 'Quick action', close: 'Close', notes: 'Shift note', feedback: 'Complaint', sales: 'Sale', messaging: 'Message', calendar: 'Calendar entry' }
    const allowed = new Set(normalizeNavigationConfig(navigationConfig).quickActionIds)
    const actions = [
        { id: 'notes' as const, icon: ArrowLeftRight, label: labels.notes },
        { id: 'feedback' as const, icon: ShieldAlert, label: labels.feedback },
        { id: 'sales' as const, icon: ReceiptText, label: labels.sales },
        { id: 'messaging' as const, icon: MessageCircle, label: labels.messaging },
        { id: 'calendar' as const, icon: CalendarPlus, label: labels.calendar },
    ].filter((action) => allowed.has(action.id))
    return (
        <div className="fixed inset-0 z-[85] flex items-end bg-black/40 p-3 backdrop-blur-[2px] md:items-center md:justify-center" onClick={closeQuickActions}>
            <section role="dialog" aria-modal="true" className="w-full rounded-2xl border border-border bg-card p-4 shadow-2xl md:max-w-md" onClick={(event) => event.stopPropagation()} aria-label={labels.title}>
                <header className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{labels.title}</h2>
                    <button ref={closeRef} onClick={closeQuickActions} aria-label={labels.close} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                </header>
                <div className="grid grid-cols-2 gap-2">
                    {actions.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => { onAction(id); closeQuickActions() }} className="flex min-h-16 items-center gap-3 rounded-lg border border-border/70 px-3 text-left text-sm font-medium hover:border-primary/40 hover:bg-primary/5">
                            <Icon className="h-4 w-4 text-primary" />{label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}
