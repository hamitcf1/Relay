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

export type SaleType = 'tour' | 'transfer' | 'laundry'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type Currency = 'EUR' | 'TRY' | 'USD' | 'GBP'

export interface PaymentEntry {
    amount: number
    currency: Currency
    timestamp: Date
    method?: string
}

export interface Sale {
    id: string
    type: SaleType
    name: string              // Tour name, Transfer destination, or "Laundry"
    customer_name: string     // Guest name
    room_number: string
    pax: number               // Number of people
    date: Date                // Date of service
    total_price: number
    collected_amount: number
    currency: Currency
    payment_status: PaymentStatus
    notes?: string
    payments?: PaymentEntry[]
    created_by: string
    created_by_name: string
    created_at: Date
    calendar_event_id?: string  // Link to auto-created calendar event
}

interface SalesState {
    sales: Sale[]
    loading: boolean
    error: string | null
}

interface SalesActions {
    subscribeToSales: (hotelId: string) => () => void
    addSale: (hotelId: string, saleData: Omit<Sale, 'id' | 'created_at' | 'payment_status'>) => Promise<string>
    updateSale: (hotelId: string, saleId: string, updates: Partial<Sale>) => Promise<void>
    deleteSale: (hotelId: string, saleId: string) => Promise<void>
    collectPayment: (hotelId: string, saleId: string, amount: number, currency?: Currency) => Promise<void>
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
                    type: data.type as SaleType,
                    name: data.name,
                    customer_name: data.customer_name,
                    room_number: data.room_number,
                    pax: data.pax || 1,
                    date: convertTimestamp(data.date),
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

        // Calculate initial payment status
        const paymentStatus: PaymentStatus =
            saleData.collected_amount >= saleData.total_price ? 'paid' :
                saleData.collected_amount > 0 ? 'partial' : 'pending'

        const docRef = await addDoc(salesRef, {
            ...saleData,
            date: Timestamp.fromDate(saleData.date),
            payment_status: paymentStatus,
            created_at: serverTimestamp()
        })

        return docRef.id
    },

    updateSale: async (hotelId, saleId, updates) => {
        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        const updateData: any = { ...updates }

        if (updates.date) {
            updateData.date = Timestamp.fromDate(updates.date)
        }

        // Recalculate payment status if amounts changed
        if (updates.collected_amount !== undefined || updates.total_price !== undefined) {
            const currentSale = get().sales.find(s => s.id === saleId)
            if (currentSale) {
                const collected = updates.collected_amount ?? currentSale.collected_amount
                const total = updates.total_price ?? currentSale.total_price
                updateData.payment_status =
                    collected >= total ? 'paid' :
                        collected > 0 ? 'partial' : 'pending'
            }
        }

        await updateDoc(saleRef, updateData)
    },

    deleteSale: async (hotelId, saleId) => {
        const saleRef = doc(db, 'hotels', hotelId, 'sales', saleId)
        await deleteDoc(saleRef)
    },

    collectPayment: async (hotelId: string, saleId: string, amount: number, currency?: Currency) => {
        const sale = get().sales.find(s => s.id === saleId)
        if (!sale) return

        const paymentCurrency = currency || sale.currency
        const newTotalCollected = sale.collected_amount + (paymentCurrency === sale.currency ? amount : 0)
        // Note: Simple logic for now, we only increment collected_amount if it's in the same currency.
        // In a real app we might convert. But the requirement is to track them.

        const newPayment: PaymentEntry = {
            amount,
            currency: paymentCurrency,
            timestamp: new Date()
        }

        const payments = [...(sale.payments || []), newPayment]

        // Recalculate status - for simplicity we assume paid if total_collected >= total_price
        // This only works if all payments are in the same currency. 
        // If not, we might need manual control or exchange rates.
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

// Helper to get display info for sale types
export const saleTypeInfo: Record<SaleType, { label: string; icon: string; color: string }> = {
    tour: { label: 'Tur', icon: '🗺️', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    transfer: { label: 'Transfer', icon: '🚐', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    laundry: { label: 'Çamaşır', icon: '🧺', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
}

export const paymentStatusInfo: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'Bekliyor', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    partial: { label: 'Kısmi', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    paid: { label: 'Ödendi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
}
