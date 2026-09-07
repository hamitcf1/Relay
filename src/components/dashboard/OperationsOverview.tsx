import { useMemo } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageFrame } from '@/components/layout/PageFrame'
import { useNotesStore } from '@/stores/notesStore'
import { useSalesStore } from '@/stores/salesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { PriorityQueue } from './PriorityQueue'
import { buildPriorityQueue } from './priorityQueueBuilder'
import { HandoverSummary } from './HandoverSummary'
import { DailySummary } from './DailySummary'

interface OperationsOverviewProps { onOpenNotes: () => void; onOpenSales: () => void; onNewRecord: () => void }

export function OperationsOverview({ onOpenNotes, onOpenSales, onNewRecord }: OperationsOverviewProps) {
    const notes = useNotesStore((state) => state.notes)
    const sales = useSalesStore((state) => state.sales)
    const language = useLanguageStore((state) => state.language)
    const copy = language === 'tr' ? {
        eyebrow: 'CANLI OPERASYON', title: 'Bugün neye müdahale gerekiyor?', description: 'Öncelikli işleri, vardiya devrini ve günün durumunu tek ekrandan takip edin.', newRecord: 'Yeni kayıt', priority: 'Öncelikli işler', priorityDescription: 'Önce ele alınması gereken kayıtlar', allRecords: 'Tüm kayıtlar', clear: 'Şu anda acil müdahale bekleyen kayıt yok.', handover: 'Vardiya devri', handoverDescription: 'Ekipten devralınan güncel notlar', openHandover: 'Devri aç', noHandover: 'Aktif devir notu yok.', today: 'Bugünün durumu', openSales: 'Satışları aç', sales: 'Satış', collected: 'Tahsil edildi', awaiting: 'Tahsilat bekliyor', openRecords: 'Açık kayıt', room: 'Oda', team: 'Ekip', critical: 'Acil', high: 'Yüksek', pinned: 'Sabit', payment: 'Ödeme bekliyor', updated: 'Güncellendi',
    } : language === 'ru' ? {
        eyebrow: 'ТЕКУЩИЕ ОПЕРАЦИИ', title: 'Что требует внимания сегодня?', description: 'Приоритетные задачи, передача смены и состояние дня на одном экране.', newRecord: 'Новая запись', priority: 'Приоритетные задачи', priorityDescription: 'Задачи, требующие внимания в первую очередь', allRecords: 'Все записи', clear: 'Срочных задач сейчас нет.', handover: 'Передача смены', handoverDescription: 'Актуальные заметки команды', openHandover: 'Открыть', noHandover: 'Нет активных заметок.', today: 'Состояние дня', openSales: 'Открыть продажи', sales: 'Продажи', collected: 'Оплачено', awaiting: 'Ожидает оплаты', openRecords: 'Открытые записи', room: 'Номер', team: 'Команда', critical: 'Срочно', high: 'Высокий', pinned: 'Закреплено', payment: 'Ожидает оплаты', updated: 'Обновлено',
    } : {
        eyebrow: 'LIVE OPERATIONS', title: 'What needs attention today?', description: 'See priority work, handover notes and today’s status in one place.', newRecord: 'New record', priority: 'Priority work', priorityDescription: 'Records that should be handled first', allRecords: 'All records', clear: 'Nothing needs urgent attention right now.', handover: 'Shift handover', handoverDescription: 'Current notes carried by the team', openHandover: 'Open handover', noHandover: 'No active handover notes.', today: "Today's status", openSales: 'Open sales', sales: 'Sales', collected: 'Collected', awaiting: 'Awaiting payment', openRecords: 'Open records', room: 'Room', team: 'Team', critical: 'Critical', high: 'High', pinned: 'Pinned', payment: 'Payment due', updated: 'Updated',
    }
    const activeNotes = useMemo(() => notes.filter((note) => note.status === 'active'), [notes])
    const queue = useMemo(() => buildPriorityQueue(activeNotes, sales), [activeNotes, sales])
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const todaySales = sales.filter((sale) => format(sale.created_at, 'yyyy-MM-dd') === todayKey && sale.status !== 'cancelled')
    const unpaidSales = sales.filter((sale) => sale.status !== 'cancelled' && sale.payment_status !== 'paid' && sale.total_price > sale.collected_amount)

    return <PageFrame eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<Button onClick={onNewRecord}><Plus />{copy.newRecord}</Button>} contentClassName="space-y-5">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
            <PriorityQueue items={queue} copy={copy} onOpen={onOpenNotes} />
            <DailySummary activeCount={activeNotes.length} saleCount={todaySales.length} collectedCount={todaySales.filter((sale) => sale.payment_status === 'paid').length} awaitingCount={unpaidSales.length} copy={copy} onOpenSales={onOpenSales} />
        </div>
        <HandoverSummary notes={activeNotes} copy={copy} onOpen={onOpenNotes} />
    </PageFrame>
}
