import type { Sale, ShiftNote } from '@/types'

export type PriorityQueueItem = { id: string; title: string; meta: string; time: Date; rank: number; label: 'critical' | 'high' | 'pinned' | 'payment'; target: 'notes' | 'sales' }

export function buildPriorityQueue(notes: ShiftNote[], sales: Sale[]): PriorityQueueItem[] {
    const noteItems = notes.filter((note) => note.is_pinned || note.priority === 'critical' || note.priority === 'high' || (note.category === 'payment_needed' && !note.is_paid)).map((note): PriorityQueueItem => ({
        id: `note-${note.id}`, title: note.content, meta: note.room_number ? `room:${note.room_number}` : note.assigned_staff_name || note.created_by_name, time: note.updated_at || note.created_at,
        rank: note.is_pinned ? 0 : note.priority === 'critical' ? 1 : note.priority === 'high' ? 2 : 3,
        label: note.is_pinned ? 'pinned' : note.priority === 'critical' ? 'critical' : note.priority === 'high' ? 'high' : 'payment',
        target: 'notes',
    }))
    const saleItems = sales.filter((sale) => sale.status !== 'cancelled' && sale.payment_status !== 'paid' && sale.total_price > sale.collected_amount).map((sale): PriorityQueueItem => ({
        id: `sale-${sale.id}`, title: sale.name, meta: sale.room_number ? `room:${sale.room_number}` : sale.customer_name, time: sale.updated_at || sale.created_at, rank: 3, label: 'payment', target: 'sales',
    }))
    return [...noteItems, ...saleItems].sort((a, b) => a.rank - b.rank || a.time.getTime() - b.time.getTime())
}
