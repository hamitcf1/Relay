import { create } from 'zustand'
import { collection, doc, setDoc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BasePrices, Agency, AgencyOverride, RoomPriceEntry, RoomType, BaseOverride } from '@/types'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'

interface PricingState {
    basePrices: BasePrices | null
    baseOverrides: BaseOverride[]
    agencies: Agency[]
    loading: boolean
    error: string | null
}

interface PricingActions {
    subscribeToBasePrices: (hotelId: string) => () => void
    subscribeToBaseOverrides: (hotelId: string) => () => void
    subscribeToAgencies: (hotelId: string) => () => void
    setBasePrices: (hotelId: string, prices: { [key in RoomType]?: RoomPriceEntry }, userId: string) => Promise<void>
    setBaseOverride: (hotelId: string, override: BaseOverride) => Promise<void>
    removeBaseOverride: (hotelId: string, overrideId: string) => Promise<void>
    addAgency: (hotelId: string, name: string) => Promise<string>
    removeAgency: (hotelId: string, agencyId: string) => Promise<void>
    setAgencyOverride: (hotelId: string, agencyId: string, override: AgencyOverride) => Promise<void>
    removeAgencyOverride: (hotelId: string, agencyId: string, overrideId: string) => Promise<void>
    updateAgencyBasePrices: (hotelId: string, agencyId: string, prices: { [key in RoomType]?: RoomPriceEntry }) => Promise<void>
    getEffectivePrice: (date: string, roomType: RoomType, agencyId?: string) => RoomPriceEntry | null
}

type PricingStore = PricingState & PricingActions

export const usePricingStore = create<PricingStore>((set, get) => ({
    basePrices: null,
    baseOverrides: [],
    agencies: [],
    loading: false,
    error: null,

    subscribeToBasePrices: (hotelId: string) => {
        set({ loading: true })
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config')
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data()
                set({
                    basePrices: {
                        prices: data.prices || {},
                        updated_at: data.updated_at?.toDate?.() || new Date(),
                        updated_by: data.updated_by || '',
                    },
                    loading: false,
                })
            } else {
                set({ basePrices: null, loading: false })
            }
        }, (error) => {
            console.error('Error subscribing to base prices:', error)
            set({ error: error.message, loading: false })
        })
        return unsubscribe
    },

    subscribeToBaseOverrides: (hotelId: string) => {
        const colRef = collection(db, 'hotels', hotelId, 'pricing', 'config', 'base_overrides')
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const baseOverrides: BaseOverride[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                baseOverrides.push({
                    id: doc.id,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    prices: data.prices || {},
                })
            })
            set({ baseOverrides })
        }, (error) => {
            console.error('Error subscribing to base overrides:', error)
        })
        return unsubscribe
    },

    subscribeToAgencies: (hotelId: string) => {
        const colRef = collection(db, 'hotels', hotelId, 'pricing', 'config', 'agencies')
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const agencies: Agency[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                agencies.push({
                    id: doc.id,
                    name: data.name,
                    base_prices: data.base_prices || {},
                    overrides: (data.overrides || []).map((o: AgencyOverride) => ({
                        id: o.id,
                        start_date: o.start_date,
                        end_date: o.end_date,
                        prices: o.prices || {},
                    })),
                    updated_at: data.updated_at?.toDate?.() || new Date(),
                })
            })
            agencies.sort((a, b) => a.name.localeCompare(b.name))
            set({ agencies })
        }, (error) => {
            console.error('Error subscribing to agencies:', error)
            set({ error: error.message })
        })
        return unsubscribe
    },

    setBasePrices: async (hotelId, prices, userId) => {
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config')
        await setDoc(docRef, {
            prices,
            updated_at: Timestamp.now(),
            updated_by: userId,
        }, { merge: true })

        // Log activity
        const user = useAuthStore.getState().user
        if (user) {
            useActivityStore.getState().logActivity(
                hotelId, user.uid, user.name, user.role,
                'pricing_update', 'Updated base prices'
            )
        }
    },

    setBaseOverride: async (hotelId, override) => {
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'base_overrides', override.id)
        await setDoc(docRef, { ...override, updated_at: Timestamp.now() }, { merge: true })
    },

    removeBaseOverride: async (hotelId, overrideId) => {
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'base_overrides', overrideId)
        await deleteDoc(docRef)
    },

    addAgency: async (hotelId, name) => {
        const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'agencies', id)
        await setDoc(docRef, {
            name,
            overrides: [],
            updated_at: Timestamp.now(),
        })
        return id
    },

    removeAgency: async (hotelId, agencyId) => {
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'agencies', agencyId)
        await deleteDoc(docRef)
    },

    setAgencyOverride: async (hotelId, agencyId, override) => {
        const agencies = get().agencies
        const agency = agencies.find(a => a.id === agencyId)
        if (!agency) throw new Error('Agency not found')
        const existingOverrides = agency.overrides.filter(o => o.id !== override.id)
        const newOverrides = [...existingOverrides, override]
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'agencies', agencyId)
        await setDoc(docRef, { overrides: newOverrides, updated_at: Timestamp.now() }, { merge: true })
    },

    removeAgencyOverride: async (hotelId, agencyId, overrideId) => {
        const agencies = get().agencies
        const agency = agencies.find(a => a.id === agencyId)
        if (!agency) throw new Error('Agency not found')
        const newOverrides = agency.overrides.filter(o => o.id !== overrideId)
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'agencies', agencyId)
        await setDoc(docRef, { overrides: newOverrides, updated_at: Timestamp.now() }, { merge: true })
    },

    updateAgencyBasePrices: async (hotelId, agencyId, base_prices) => {
        const docRef = doc(db, 'hotels', hotelId, 'pricing', 'config', 'agencies', agencyId)
        await setDoc(docRef, { base_prices, updated_at: Timestamp.now() }, { merge: true })

        // Log activity
        const user = useAuthStore.getState().user
        if (user) {
            useActivityStore.getState().logActivity(
                hotelId, user.uid, user.name, user.role,
                'pricing_update', `Updated agency prices: ${agencyId}`
            )
        }
    },

    getEffectivePrice: (date, roomType, agencyId?) => {
        const { basePrices, baseOverrides, agencies } = get()
        if (agencyId) {
            const agency = agencies.find(a => a.id === agencyId)
            if (agency) {
                const override = agency.overrides.find(o => date >= o.start_date && date <= o.end_date)
                if (override?.prices[roomType]) return override.prices[roomType]!
                if (agency.base_prices?.[roomType]) return agency.base_prices[roomType]!
            }
        }
        const baseOverride = baseOverrides.find(o => date >= o.start_date && date <= o.end_date)
        if (baseOverride?.prices[roomType]) return baseOverride.prices[roomType]!
        if (basePrices?.prices[roomType]) return basePrices.prices[roomType]!
        return null
    },
}))
