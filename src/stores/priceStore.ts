import { create } from 'zustand'
import { collection, doc, setDoc, onSnapshot, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyPrice, RoomType, Currency, AgencyTier } from '@/types'

interface PriceState {
    prices: Record<string, DailyPrice> // Key: YYYY-MM-DD
    loading: boolean
    error: string | null
    currentDate: string | null // Selected date for viewing
}

interface PriceActions {
    loadPrices: (hotelId: string, startDate: string, endDate: string) => Promise<void>
    subscribeToPrices: (hotelId: string, startDate: string, endDate: string) => () => void
    setPrice: (hotelId: string, date: string, roomType: RoomType, tier: AgencyTier, amount: number, currency: Currency, userId: string) => Promise<void>
    getPrice: (date: string, roomType: RoomType, tier: AgencyTier) => { amount: number, currency: Currency } | null
}

type PriceStore = PriceState & PriceActions

export const usePriceStore = create<PriceStore>((set, get) => ({
    prices: {},
    loading: false,
    error: null,
    currentDate: null,

    loadPrices: async (hotelId, startDate, endDate) => {
        set({ loading: true, error: null })
        try {
            const pricesRef = collection(db, 'hotels', hotelId, 'daily_prices')
            const q = query(pricesRef, where('date', '>=', startDate), where('date', '<=', endDate))
            const snapshot = await getDocs(q)

            const newPrices: Record<string, DailyPrice> = {}
            snapshot.forEach(doc => {
                const data = doc.data() as DailyPrice
                // Convert timestamp to Date if needed, though interface says Date
                if (data.updated_at && (data.updated_at as any).toDate) {
                    data.updated_at = (data.updated_at as any).toDate()
                }
                newPrices[data.date] = data
            })

            set(state => ({
                prices: { ...state.prices, ...newPrices },
                loading: false
            }))
        } catch (error) {
            console.error('Error loading prices:', error)
            set({ error: (error as Error).message, loading: false })
        }
    },

    subscribeToPrices: (hotelId, startDate, endDate) => {
        const pricesRef = collection(db, 'hotels', hotelId, 'daily_prices')
        const q = query(pricesRef, where('date', '>=', startDate), where('date', '<=', endDate))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPrices: Record<string, DailyPrice> = {}
            snapshot.forEach(doc => {
                const data = doc.data() as DailyPrice
                if (data.updated_at && (data.updated_at as any).toDate) {
                    data.updated_at = (data.updated_at as any).toDate()
                }
                newPrices[data.date] = data
            })

            set(state => ({
                prices: { ...state.prices, ...newPrices }
            }))
        }, (error) => {
            console.error('Error subscribing to prices:', error)
            set({ error: error.message })
        })

        return unsubscribe
    },

    setPrice: async (hotelId, date, roomType, tier, amount, currency, userId) => {
        try {
            const prices = get().prices
            const existingDay = prices[date] || {
                id: date,
                date,
                prices: {},
                updated_at: new Date(),
                updated_by: userId
            }

            // Deep clone
            const updatedPrices = JSON.parse(JSON.stringify(existingDay.prices))

            // Initialize if missing
            if (!updatedPrices[roomType]) {
                updatedPrices[roomType] = {
                    standard: { amount: 0, currency: 'EUR' },
                    special_group: { amount: 0, currency: 'EUR' }
                }
            }

            // Update specific tier
            if (updatedPrices[roomType]) {
                updatedPrices[roomType][tier] = { amount, currency }
            }

            const docRef = doc(db, 'hotels', hotelId, 'daily_prices', date)
            const payload = {
                ...existingDay,
                prices: updatedPrices,
                updated_at: Timestamp.now(),
                updated_by: userId
            }

            await setDoc(docRef, payload, { merge: true })

            // Optimistic update
            set(state => ({
                prices: {
                    ...state.prices,
                    [date]: {
                        ...payload,
                        updated_at: new Date()
                    }
                }
            }))

        } catch (error) {
            console.error('Error setting price:', error)
            throw error
        }
    },

    getPrice: (date, roomType, tier) => {
        const day = get().prices[date]
        if (!day || !day.prices[roomType]) return null

        const priceData = day.prices[roomType]!
        // Handle migration/fallback if data is old structure (optional but good practice)
        // For now assuming stricter types as we just changed it.
        // If "amount" exists directly, it's the new structure.

        const tierData = priceData[tier]
        if (typeof tierData === 'object' && 'amount' in tierData) {
            return {
                amount: tierData.amount,
                currency: tierData.currency
            }
        }

        return null
    }
}))
