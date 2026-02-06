import { create } from 'zustand'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Sale, SaleType, PaymentStatus, Currency, PaymentEntry } from '@/types'

// Helper to get display info for sale types
export const saleTypeInfo: Record<SaleType, { label: string; icon: string; color: string }> = {
    tour: { label: 'Tour', icon: '🗺️', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    transfer: { label: 'Transfer', icon: '🚐', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    laundry: { label: 'Laundry', icon: '🧺', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    other: { label: 'Other', icon: '📦', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' }
}

export const paymentStatusInfo: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    partial: { label: 'Partial', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    paid: { label: 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
}

interface SalesState {
    sales: Sale[]
    loading: boolean
    error: string | null
}

interface SalesActions {
    subscribeToSales: (hotelId: string) => () => void
    addSale: (hotelId: string, saleData: Omit<Sale, 'id' | 'created_at' | 'payment_status' | 'collected_amount' | 'hotel_id'>) => Promise<string>
    updateSale: (hotelId: string, saleId: string, updates: Partial<Sale>) => Promise<void>
    deleteSale: (hotelId: string, saleId: string) => Promise<void>
    collectPayment: (hotelId: string, saleId: string, amount: number, currency?: Currency, targetAmount?: number) => Promise<void>
    getDueSales: () => Sale[]
    getSalesByType: (type: SaleType) => Sale[]
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

export const useSalesStore = create<SalesState & SalesActions>((set, get) => ({
    sales: [],
    loading: false,
    error: null,

    subscribeToSales: (hotelId) => {
        set({ loading: true, error: null })

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
                    pickup_time: data.pickup_time,
                    ticket_number: data.ticket_number,
                    total_price: data.total_price || 0,
                    collected_amount: data.collected_amount || 0,
                    currency: data.currency || 'EUR',
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

            set({ sales: salesList, loading: false })
        }, (error) => {
            console.error('Sales subscription error:', error)
            set({ error: error.message, loading: false })
        })

        return unsubscribe
    },

    addSale: async (hotelId, saleData) => {
        const salesRef = collection(db, 'hotels', hotelId, 'sales')

        // 1. Prepare Sale Data
        const saleDocData = {
            ...saleData,
            collected_amount: 0,
            payment_status: 'pending' as PaymentStatus,
            date: Timestamp.fromDate(saleData.date),
            created_at: serverTimestamp()
        }

        // 2. Add Sale First to get ID
        const docRef = await addDoc(salesRef, saleDocData)
        const saleId = docRef.id

        // 3. If Tour/Transfer, create Calendar Event automatically
        if (saleData.type === 'tour' || saleData.type === 'transfer') {
            try {
                const eventsRef = collection(db, 'hotels', hotelId, 'calendar_events')
                const eventData = {
                    type: saleData.type,
                    title: `${saleTypeInfo[saleData.type].icon} ${saleData.name} - ${saleData.room_number}`,
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
                const eventRef = await addDoc(eventsRef, eventData)

                // 4. Update Sale with Event ID
                await updateDoc(docRef, { calendar_event_id: eventRef.id })
            } catch (error) {
                console.error("Failed to auto-create calendar event:", error)
            }
        }

        return saleId
    },

    updateSale: async (hotelId, saleId, updates) => {
        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        const updateData: any = { ...updates }

        if (updates.date) {
            updateData.date = Timestamp.fromDate(updates.date)
        }

        // Recalculate payment status if amounts changed
        if (updates.total_price !== undefined) {
            const currentSale = get().sales.find(s => s.id === saleId)
            if (currentSale) {
                const collected = currentSale.collected_amount
                const total = updates.total_price
                updateData.payment_status =
                    collected >= total ? 'paid' :
                        collected > 0 ? 'partial' : 'pending'
            }
        }

        updateData.updated_at = serverTimestamp()
        await updateDoc(saleRef, updateData)

        // Sync to calendar if critical fields changed
        const currentSale = get().sales.find(s => s.id === saleId)
        if (currentSale?.calendar_event_id) {
            const syncUpdates: any = {}
            if (updates.date) syncUpdates.date = Timestamp.fromDate(updates.date)
            if (updates.pickup_time) syncUpdates.time = updates.pickup_time
            if (updates.total_price !== undefined) syncUpdates.total_price = updates.total_price
            if (updates.name) syncUpdates.title = `${saleTypeInfo[currentSale.type].icon} ${updates.name} - Room ${currentSale.room_number}`
            if (updates.room_number) syncUpdates.room_number = updates.room_number
            if (updates.notes) syncUpdates.description = `Guest: ${currentSale.customer_name}\nPax: ${currentSale.pax}\nPrice: ${currentSale.total_price} ${currentSale.currency}\nNotes: ${updates.notes}`

            if (Object.keys(syncUpdates).length > 0) {
                try {
                    const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', currentSale.calendar_event_id)
                    await updateDoc(eventRef, syncUpdates)
                } catch (err) {
                    console.error("Failed to sync calendar event:", err)
                }
            }
        }
    },

    deleteSale: async (hotelId, saleId) => {
        const sale = get().sales.find(s => s.id === saleId)
        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        await deleteDoc(saleRef)

        // Also delete calendar event if exists
        if (sale?.calendar_event_id) {
            try {
                const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', sale.calendar_event_id)
                await deleteDoc(eventRef)
            } catch (err) {
                console.error("Failed to delete calendar event:", err)
            }
        }
    },

    collectPayment: async (hotelId: string, saleId: string, amount: number, currency?: Currency, targetAmount?: number) => {
        const sale = get().sales.find(s => s.id === saleId)
        if (!sale) return

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

        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        await updateDoc(saleRef, {
            collected_amount: newTotalCollected,
            payment_status: paymentStatus,
            payments: payments.map(p => ({
                ...p,
                timestamp: Timestamp.fromDate(p.timestamp)
            }))
        })

        // Sync to calendar
        if (sale.calendar_event_id) {
            try {
                const eventRef = doc(db, 'hotels', hotelId, 'calendar_events', sale.calendar_event_id)
                await updateDoc(eventRef, {
                    collected_amount: newTotalCollected,
                    updated_at: serverTimestamp()
                })
            } catch (error) {
                console.error('Error updating calendar event for sale:', error)
            }
        }
    },

    getDueSales: () => {
        return get().sales.filter(sale => sale.payment_status !== 'paid')
    },

    getSalesByType: (type) => {
        return get().sales.filter(sale => sale.type === type)
    }
}))
