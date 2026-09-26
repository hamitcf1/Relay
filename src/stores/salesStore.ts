import { create } from 'zustand'
import { toast } from 'sonner'
import {
    collection,
    getDoc,
    getDocs,
    where,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Sale, SaleType, PaymentStatus, Currency, PaymentEntry, SaleStatus } from '@/types'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'
import { useCalendarStore } from './calendarStore'
import { useNotesStore } from './notesStore'

// Helper to get display info for sale types
export const saleTypeInfo: Record<SaleType, { label: string; icon: string; color: string }> = {
    tour: { label: 'sales.type.tour', icon: '🗺️', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    transfer: { label: 'sales.type.transfer', icon: '🚐', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    laundry: { label: 'sales.type.laundry', icon: '🧺', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    other: { label: 'sales.type.other', icon: '📦', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' }
}

export const saleStatusInfo: Record<SaleStatus, { label: string; color: string }> = {
    waiting: { label: 'sales.status.waiting', color: 'bg-zinc-500/20 text-zinc-400' },
    confirmed: { label: 'sales.status.confirmed', color: 'bg-blue-500/20 text-blue-400' },
    pickup_pending: { label: 'sales.status.pickup_pending', color: 'bg-amber-500/20 text-amber-400' },
    realized: { label: 'sales.status.realized', color: 'bg-emerald-500/20 text-emerald-400' },
    delivered: { label: 'sales.status.delivered', color: 'bg-purple-500/20 text-purple-400' },
    cancelled: { label: 'sales.status.cancelled', color: 'bg-rose-500/20 text-rose-400' },
}

export const paymentStatusInfo: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'sales.payment.pending', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    partial: { label: 'sales.payment.partial', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    paid: { label: 'sales.payment.paid', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'sales.payment.cancelled', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
    refunded: { label: 'sales.payment.refunded', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
}

interface SalesState {
    sales: Sale[]
    loading: boolean
    /**
     * True once a subscription has actually delivered a result, which is not the same as
     * `loading` being false: that is also the state before anything has been subscribed, and the
     * two look identical to a caller. Anything that has to tell "there is nothing here" from
     * "we have not looked yet" needs this instead, or it will act on the empty starting array.
     */
    loaded: boolean
    error: string | null
}

interface SalesActions {
    subscribeToSales: (hotelId: string) => () => void
    addSale: (hotelId: string, saleData: Omit<Sale, 'id' | 'created_at' | 'payment_status' | 'collected_amount' | 'hotel_id'>) => Promise<string>
    updateSale: (hotelId: string, saleId: string, updates: Partial<Sale>) => Promise<void>
    deleteSale: (hotelId: string, saleId: string) => Promise<void>
    collectPayment: (hotelId: string, saleId: string, amount: number, currency?: Currency, targetAmount?: number) => Promise<void>
    markPaymentCancelled: (hotelId: string, saleId: string) => Promise<void>
    refundPayment: (hotelId: string, saleId: string) => Promise<void>
    getDueSales: () => Sale[]
    getSalesByType: (type: SaleType) => Sale[]
    bulkUpdateSales: (hotelId: string, saleIds: string[], updates: Partial<Sale>) => Promise<void>
    bulkDeleteSales: (hotelId: string, saleIds: string[]) => Promise<void>
    emptySalesTrash: (hotelId: string) => Promise<void>
}

const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate()
    }
    if (timestamp instanceof Date) {
        return timestamp
    }
    return new Date()
}

/**
 * Sales that have not been paid in full and are still live.
 *
 * Exported as a pure function so a caller that already holds the list does not have to go back
 * through the store for it, which keeps the definition of "owed" in one place.
 */
export function filterDueSales(sales: Sale[]): Sale[] {
    return sales.filter(sale =>
        sale.status !== 'cancelled' &&
        sale.payment_status !== 'paid' &&
        sale.payment_status !== 'cancelled' &&
        sale.payment_status !== 'refunded'
    )
}

export const useSalesStore = create<SalesState & SalesActions>((set, get) => ({
    sales: [],
    loading: false,
    loaded: false,
    error: null,

    subscribeToSales: (hotelId) => {
        set({ loading: true, loaded: false, error: null })

        if (hotelId === 'demo-hotel-id') {
            set({
                loaded: true,
                sales: [{
                    id: 'demo-sale-transfer', hotel_id: hotelId, type: 'transfer', name: 'Airport transfer', customer_name: 'Demo Guest', room_number: '305', pax: 2,
                    date: new Date(), pickup_time: '06:30', total_price: 45, collected_amount: 0, currency: 'EUR', payment_status: 'pending', status: 'confirmed',
                    created_by: 'demo-user-staff', created_by_name: 'Receptionist', created_at: new Date(Date.now() - 3600000), payments: [],
                }],
                loading: false,
                error: null,
            })
            return () => {}
        }

        const salesRef = collection(db, 'hotels', hotelId, 'sales')
        const q = query(salesRef, orderBy('date', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesList: Sale[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    hotel_id: hotelId,
                    type: data.type as SaleType,
                    name: data.name,
                    customer_name: data.customer_name,
                    room_number: data.room_number,
                    pax: data.pax || 1,
                    date: convertTimestamp(data.date),
                    sale_date: data.sale_date ? convertTimestamp(data.sale_date) : convertTimestamp(data.created_at),
                    pickup_time: data.pickup_time,
                    ticket_number: data.ticket_number,
                    total_price: data.total_price || 0,
                    collected_amount: data.collected_amount || 0,
                    currency: data.currency || 'EUR',
                    status: data.status as SaleStatus || 'waiting',
                    priority: data.priority || 'low',
                    lifecycle_status: data.lifecycle_status || 'active',
                    trashed_at: data.trashed_at ? convertTimestamp(data.trashed_at) : undefined,
                    payment_status: data.payment_status as PaymentStatus,
                    notes: data.notes,
                    created_by: data.created_by,
                    created_by_name: data.created_by_name || 'Unknown',
                    created_at: convertTimestamp(data.created_at),
                    calendar_event_id: data.calendar_event_id,
                    payments: data.payments?.map((p: any) => ({
                        amount: p.amount,
                        currency: p.currency,
                        timestamp: convertTimestamp(p.timestamp),
                        method: p.method
                    })) || []
                }
            })

            // Auto purge sales trash older than 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            const expiredTrash = salesList.filter(s => s.lifecycle_status === 'trash' && ((s.trashed_at || s.updated_at || s.created_at) < thirtyDaysAgo))
            if (expiredTrash.length > 0 && hotelId !== 'demo-hotel-id') {
                expiredTrash.forEach(async (s) => {
                    try {
                        await deleteDoc(doc(db, 'hotels', hotelId, 'sales', s.id))
                    } catch (e) {
                        console.error('Sales trash auto purge error:', e)
                    }
                })
            }

            set({ sales: salesList, loading: false, loaded: true })
        }, (error) => {
            console.error('Sales subscription error:', error)
            // A failed subscription has not told us anything about the sales, so `loaded` stays
            // false on purpose. Reporting it as loaded would make an empty list look authoritative.
            set({ error: error.message, loading: false })
        })

        return unsubscribe
    },

    addSale: async (hotelId, saleData) => {
        const isDemo = hotelId === 'demo-hotel-id'

        // 1. Prepare Sale Data
        const saleDocData = {
            ...saleData,
            collected_amount: 0,
            payment_status: 'pending' as PaymentStatus,
            date: Timestamp.fromDate(saleData.date),
            sale_date: Timestamp.fromDate(saleData.sale_date || new Date()),
            created_at: serverTimestamp()
        }

        // 2. Add Sale First to get ID
        const saleId = isDemo
            ? `demo-sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            : (await addDoc(collection(db, 'hotels', hotelId, 'sales'), saleDocData)).id

        if (isDemo) {
            set((state) => ({
                sales: [{
                    ...saleData,
                    id: saleId,
                    hotel_id: hotelId,
                    sale_date: saleData.sale_date || new Date(),
                    created_at: new Date(),
                    collected_amount: 0,
                    payment_status: 'pending',
                    payments: [],
                }, ...state.sales],
            }))
        }

        toast.success(`Sale added: ${saleData.name}`)

        // 3. If Tour/Transfer, create Calendar Event automatically
        if (saleData.type === 'tour' || saleData.type === 'transfer') {
            try {
                const eventData = {
                    type: saleData.type,
                    title: `${saleTypeInfo[saleData.type].icon} ${saleData.name}${saleData.room_number ? ` - Oda ${saleData.room_number}` : ''}`,
                    description: `Guest: ${saleData.customer_name}\nPax: ${saleData.pax}\nPrice: ${saleData.total_price} ${saleData.currency}`,
                    date: Timestamp.fromDate(saleData.date),
                    time: saleData.pickup_time || null, // Use pickup time if available
                    room_number: saleData.room_number,
                    total_price: saleData.total_price,
                    collected_amount: 0,
                    currency: saleData.currency,
                    created_by: saleData.created_by,
                    created_by_name: saleData.created_by_name,
                    sale_id: saleId, // Link back to sale
                    created_at: serverTimestamp()
                }

                // 4. Update Sale with Event ID
                if (isDemo) {
                    const eventId = await useCalendarStore.getState().addEvent(hotelId, {
                        type: eventData.type,
                        title: eventData.title,
                        description: eventData.description,
                        date: saleData.date,
                        time: eventData.time,
                        room_number: eventData.room_number,
                        total_price: eventData.total_price,
                        collected_amount: 0,
                        currency: eventData.currency,
                        created_by: eventData.created_by,
                        created_by_name: eventData.created_by_name,
                    })
                    set((state) => ({
                        sales: state.sales.map(s => s.id === saleId ? { ...s, calendar_event_id: eventId } : s)
                    }))
                } else {
                    const eventRef = await addDoc(collection(db, 'hotels', hotelId, 'calendar_events'), eventData)
                    await updateDoc(doc(db, 'hotels', hotelId, 'sales', saleId), { calendar_event_id: eventRef.id })
                }
            } catch (error) {
                console.error("Failed to auto-create calendar event:", error)
            }
        }

        // Log activity
        const user = useAuthStore.getState().user
        if (user) {
            useActivityStore.getState().logActivity(
                hotelId, user.uid, user.name, user.role,
                'sale_create', `${saleData.type}: ${saleData.name}`
            )
        }

        return saleId
    },

    updateSale: async (hotelId, saleId, updates) => {
        const isDemo = hotelId === 'demo-hotel-id'
        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        const localPatch: any = { ...updates }
        const currentSale = get().sales.find(s => s.id === saleId)

        // Recalculate payment status if amounts changed
        if (updates.total_price !== undefined) {
            if (currentSale) {
                const collected = currentSale.collected_amount
                const total = updates.total_price
                localPatch.payment_status =
                    collected >= total ? 'paid' :
                        collected > 0 ? 'partial' : 'pending'
            }
        }

        // Cancellation handling: a cancelled sale must not expect payment
        if (updates.status === 'cancelled' && currentSale) {
            // No money was taken -> mark the payment as cancelled (not received)
            if (currentSale.collected_amount === 0 && !(currentSale.payments || []).length) {
                localPatch.payment_status = 'cancelled'
            }
            // If money was already collected, keep payment_status as-is so the
            // user can decide to refund it or keep it as received.
        }

        // Re-activation: sale is no longer cancelled -> recompute payment status
        if (updates.status && updates.status !== 'cancelled' && currentSale?.status === 'cancelled') {
            const total = updates.total_price ?? currentSale.total_price
            const collected = currentSale.collected_amount
            localPatch.payment_status =
                collected >= total ? 'paid' :
                    collected > 0 ? 'partial' : 'pending'
        }

        localPatch.updated_at = new Date()
        if (isDemo) {
            set((state) => ({ sales: state.sales.map(s => s.id === saleId ? { ...s, ...localPatch } : s) }))
        } else {
            const updateData: any = { ...localPatch, updated_at: serverTimestamp() }
            if (updates.date) updateData.date = Timestamp.fromDate(updates.date)
            if (updates.sale_date) updateData.sale_date = Timestamp.fromDate(updates.sale_date)
            await updateDoc(saleRef, updateData)
        }

        if (currentSale && (updates.total_price !== undefined || updates.name !== undefined || updates.date !== undefined || updates.pickup_time !== undefined || updates.room_number !== undefined || updates.customer_name !== undefined || updates.notes !== undefined || updates.sale_date !== undefined)) {
            await syncLinkedNotes(hotelId, saleId, currentSale.collected_amount, updates.total_price ?? currentSale.total_price, localPatch.payment_status || currentSale.payment_status, { ...currentSale, ...updates })
        }
        toast.success('Sale updated')

        // Sync to calendar if critical fields changed
        if (currentSale?.calendar_event_id) {
            const syncUpdates: any = {}
            if (updates.date) syncUpdates.date = updates.date
            if (updates.pickup_time) syncUpdates.time = updates.pickup_time
            if (updates.total_price !== undefined) syncUpdates.total_price = updates.total_price
            if (updates.name || updates.room_number !== undefined) syncUpdates.title = `${saleTypeInfo[currentSale.type].icon} ${updates.name || currentSale.name}${(updates.room_number ?? currentSale.room_number) ? ` - Oda ${updates.room_number ?? currentSale.room_number}` : ''}`
            if (updates.room_number !== undefined) syncUpdates.room_number = updates.room_number
            if (updates.notes !== undefined || updates.customer_name !== undefined) syncUpdates.description = `Guest: ${updates.customer_name ?? currentSale.customer_name}\nPax: ${currentSale.pax}\nPrice: ${updates.total_price ?? currentSale.total_price} ${updates.currency ?? currentSale.currency}\nNotes: ${updates.notes ?? currentSale.notes ?? ''}`

            if (Object.keys(syncUpdates).length > 0) {
                try {
                    if (isDemo) {
                        await useCalendarStore.getState().updateEvent(hotelId, currentSale.calendar_event_id, syncUpdates)
                    } else {
                        const firestoreSync: any = syncUpdates.date
                            ? { ...syncUpdates, date: Timestamp.fromDate(syncUpdates.date) }
                            : { ...syncUpdates }
                        const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', currentSale.calendar_event_id)
                        await updateDoc(eventRef, firestoreSync)
                    }
                } catch (err) {
                    console.error("Failed to sync calendar event:", err)
                }
            }
        }

        // Log activity
        const authUser = useAuthStore.getState().user
        if (authUser) {
            useActivityStore.getState().logActivity(
                hotelId, authUser.uid, authUser.name, authUser.role,
                'sale_update', `Sale ${saleId}`
            )
        }
    },

    deleteSale: async (hotelId, saleId) => {
        const isDemo = hotelId === 'demo-hotel-id'
        const sale = get().sales.find(s => s.id === saleId)

        if (isDemo) {
            set((state) => ({ sales: state.sales.filter(s => s.id !== saleId) }))
            useNotesStore.setState((state) => ({
                notes: state.notes.filter(n => n.sale_id !== saleId),
            }))
        } else {
            const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
            await deleteDoc(saleRef)
            try {
                const linked = await getDocs(query(collection(db, 'hotels', hotelId, 'shift_notes'), where('sale_id', '==', saleId)))
                await Promise.all(linked.docs.map(note => deleteDoc(note.ref)))
            } catch (error) {
                console.error('Linked shift note deletion failed:', error)
                toast.error('Satış silindi ancak bağlı nöbet notu silinemedi.')
            }
        }
        toast.success('Sale deleted')

        // Also delete calendar event if exists
        if (sale?.calendar_event_id) {
            try {
                if (isDemo) {
                    await useCalendarStore.getState().deleteEvent(hotelId, sale.calendar_event_id)
                } else {
                    const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', sale.calendar_event_id)
                    await deleteDoc(eventRef)
                }
            } catch (err) {
                console.error("Failed to delete calendar event:", err)
            }
        }
    },

    collectPayment: async (hotelId: string, saleId: string, amount: number, currency?: Currency, targetAmount?: number) => {
        const isDemo = hotelId === 'demo-hotel-id'
        let sale = get().sales.find(s => s.id === saleId)
        if (!sale) {
            if (isDemo) throw new Error('Sale not found')
            const snapshot = await getDoc(doc(db, 'hotels', hotelId, 'sales', saleId))
            if (!snapshot.exists()) throw new Error('Sale not found')
            const data = snapshot.data()
            sale = { ...data, id: saleId, hotel_id: hotelId, date: convertTimestamp(data.date), created_at: convertTimestamp(data.created_at), collected_amount: data.collected_amount || 0, payments: data.payments || [] } as Sale
        }

        const paymentCurrency = currency || sale.currency
        // Use targetAmount if provided (for cross-currency), otherwise use straight amount if matching currency
        const effectiveCollectedAmount = targetAmount !== undefined
            ? targetAmount
            : (paymentCurrency === sale.currency ? amount : 0) // Fallback: if no target amount and mismatch, don't increment (or handle differently)

        // Safety check: if no target amount and currency differs, we can't calculate balance update accurately without a rate.
        // For now, we assume if targetAmount is missing, currency matches OR user didn't specify exchange value (which is bad).
        // But the UI will ensure targetAmount is passed if currencies differ.

        const newTotalCollected = sale.collected_amount + effectiveCollectedAmount

        const newPayment: PaymentEntry = {
            amount,
            currency: paymentCurrency,
            timestamp: new Date()
        }

        const payments = [...(sale.payments || []), newPayment]

        const paymentStatus: PaymentStatus =
            newTotalCollected >= sale.total_price ? 'paid' :
                newTotalCollected > 0 ? 'partial' : 'pending'

        if (isDemo) {
            set((state) => ({
                sales: state.sales.map(s => s.id === saleId
                    ? { ...s, collected_amount: newTotalCollected, payment_status: paymentStatus, payments }
                    : s)
            }))
        } else {
            const sanitizedPayments = payments.map(p => {
                const entry: any = {
                    amount: p.amount,
                    currency: p.currency,
                    timestamp: Timestamp.fromDate(p.timestamp)
                }
                if (p.method) entry.method = p.method
                if (p.recorded_by) entry.recorded_by = p.recorded_by
                return entry
            })

            const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
            await updateDoc(saleRef, {
                collected_amount: newTotalCollected,
                payment_status: paymentStatus,
                payments: sanitizedPayments
            })
        }
        await syncLinkedNotes(hotelId, saleId, newTotalCollected, sale.total_price, paymentStatus)
        toast.success(paymentStatus === 'paid' ? 'Fully paid! ✓' : `Payment collected: ${amount} ${paymentCurrency}`)

        // Sync to calendar
        if (sale.calendar_event_id) {
            try {
                if (isDemo) {
                    await useCalendarStore.getState().updateEvent(hotelId, sale.calendar_event_id, { collected_amount: newTotalCollected })
                } else {
                    const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', sale.calendar_event_id)
                    await updateDoc(eventRef, {
                        collected_amount: newTotalCollected,
                        updated_at: serverTimestamp()
                    })
                }
            } catch (error) {
                console.error('Error updating calendar event for sale:', error)
            }
        }
    },

    markPaymentCancelled: async (hotelId: string, saleId: string) => {
        if (hotelId === 'demo-hotel-id') {
            set((state) => ({
                sales: state.sales.map(s => s.id === saleId
                    ? { ...s, payment_status: 'cancelled', updated_at: new Date() }
                    : s)
            }))
        } else {
            const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
            await updateDoc(saleRef, {
                payment_status: 'cancelled',
                updated_at: serverTimestamp()
            })
        }
        await syncLinkedNotes(hotelId, saleId, 0, get().sales.find(s => s.id === saleId)?.total_price || 0, 'cancelled')
        toast.success('Payment cancelled')
    },

    refundPayment: async (hotelId: string, saleId: string) => {
        const sale = get().sales.find(s => s.id === saleId)
        if (!sale) return

        if (hotelId === 'demo-hotel-id') {
            set((state) => ({
                sales: state.sales.map(s => s.id === saleId
                    ? { ...s, payment_status: 'refunded', collected_amount: 0, updated_at: new Date() }
                    : s)
            }))
        } else {
            const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
            await updateDoc(saleRef, {
                payment_status: 'refunded',
                collected_amount: 0,
                updated_at: serverTimestamp()
            })
        }
        await syncLinkedNotes(hotelId, saleId, 0, sale.total_price, 'refunded')
        toast.success('Payment refunded')

        // Sync to calendar
        if (sale.calendar_event_id) {
            try {
                if (hotelId === 'demo-hotel-id') {
                    await useCalendarStore.getState().updateEvent(hotelId, sale.calendar_event_id, { collected_amount: 0 })
                } else {
                    const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', sale.calendar_event_id)
                    await updateDoc(eventRef, {
                        collected_amount: 0,
                        updated_at: serverTimestamp()
                    })
                }
            } catch (error) {
                console.error('Error updating calendar event for refund:', error)
            }
        }
    },

    getDueSales: () => filterDueSales(get().sales),

    getSalesByType: (type) => {
        return get().sales.filter(sale => sale.type === type)
    },

    bulkUpdateSales: async (hotelId: string, saleIds: string[], updates: Partial<Sale>) => {
        if (saleIds.length === 0) return
        try {
            const isDemo = hotelId === 'demo-hotel-id'
            if (isDemo) {
                set((state) => ({
                    sales: state.sales.map(s => saleIds.includes(s.id) ? { ...s, ...updates, updated_at: new Date() } : s)
                }))
            } else {
                const docUpdate = { ...updates, updated_at: serverTimestamp() }
                const batch = writeBatch(db)
                saleIds.forEach(id => {
                    const saleRef = doc(db, 'hotels', hotelId, 'sales', id)
                    batch.update(saleRef, docUpdate)
                })
                await batch.commit()
            }
            toast.success(`${saleIds.length} satış güncellendi`)
        } catch (error) {
            console.error('Error bulk updating sales:', error)
            toast.error('Toplu satış güncelleme başarısız')
        }
    },

    bulkDeleteSales: async (hotelId: string, saleIds: string[]) => {
        if (saleIds.length === 0) return
        try {
            const isDemo = hotelId === 'demo-hotel-id'
            if (isDemo) {
                set((state) => ({ sales: state.sales.filter(s => !saleIds.includes(s.id)) }))
            } else {
                const batch = writeBatch(db)
                saleIds.forEach(id => {
                    const saleRef = doc(db, 'hotels', hotelId, 'sales', id)
                    batch.delete(saleRef)
                })
                await batch.commit()
            }
            toast.success(`${saleIds.length} satış silindi`)
        } catch (error) {
            console.error('Error bulk deleting sales:', error)
            toast.error('Toplu silme başarısız')
        }
    },

    emptySalesTrash: async (hotelId: string) => {
        try {
            const { sales } = get()
            const trashIds = sales.filter(s => s.lifecycle_status === 'trash').map(s => s.id)
            if (trashIds.length === 0) {
                toast.info('Çöp kutusu boş')
                return
            }

            const isDemo = hotelId === 'demo-hotel-id'
            if (isDemo) {
                set((state) => ({ sales: state.sales.filter(s => s.lifecycle_status !== 'trash') }))
            } else {
                const batch = writeBatch(db)
                trashIds.forEach(id => {
                    const saleRef = doc(db, 'hotels', hotelId, 'sales', id)
                    batch.delete(saleRef)
                })
                await batch.commit()
            }
            toast.success('Satış çöp kutusu temizlendi')
        } catch (error) {
            console.error('Error emptying sales trash:', error)
            toast.error('Çöp kutusu temizlenemedi')
        }
    }
}))

async function syncLinkedNotes(hotelId: string, saleId: string, collected: number, total: number, status: PaymentStatus, sale?: Sale) {
    const isDemo = hotelId === 'demo-hotel-id'
    const content = sale ? [saleTypeInfo[sale.type]?.icon, sale.name, sale.customer_name && `Misafir: ${sale.customer_name}`, sale.room_number && `Oda: ${sale.room_number}`, `Satış: ${(sale.sale_date || sale.created_at).toLocaleDateString('tr-TR')}`, `Hizmet: ${sale.date.toLocaleDateString('tr-TR')}`, sale.pickup_time && `Alış saati: ${sale.pickup_time}`, `${total} ${sale.currency}`, sale.notes].filter(Boolean).join(' · ') : undefined

    if (isDemo) {
        const patch = {
            ...(content ? { content, room_number: sale?.room_number || null, guest_name: sale?.customer_name || null } : {}),
            amount_due: Math.max(0, total - collected),
            is_paid: status === 'paid',
            updated_at: new Date(),
        }
        useNotesStore.setState((state) => ({
            notes: state.notes.map(n => n.sale_id === saleId ? { ...n, ...patch } : n)
        }))
        return
    }

    try {
        const notes = await getDocs(query(collection(db, 'hotels', hotelId, 'shift_notes'), where('sale_id', '==', saleId)))
        await Promise.all(notes.docs.map(note => updateDoc(note.ref, {
            ...(content ? { content, room_number: sale?.room_number || null, guest_name: sale?.customer_name || null } : {}),
            amount_due: Math.max(0, total - collected),
            is_paid: status === 'paid',
            updated_at: serverTimestamp()
        })))
    } catch (error) {
        console.error('Linked shift note sync failed:', error)
        toast.error('Satış kaydedildi ancak nöbet notu güncellenemedi.')
    }
}
