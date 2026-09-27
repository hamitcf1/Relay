import { create } from 'zustand'
import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
    Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement, AnnouncementReceipt } from '@/types'

const DEMO_HOTEL_ID = 'demo-hotel-id'

/** An announcement is a record of its own so it can be withdrawn and audited. */
const toAnnouncement = (id: string, data: Record<string, any>): Announcement => ({
    id,
    title: data.title || undefined,
    content: data.content || '',
    audience: data.audience === 'selected' ? 'selected' : 'all',
    recipientIds: data.recipientIds || undefined,
    recipientNames: data.recipientNames || undefined,
    createdBy: data.createdBy || '',
    createdByName: data.createdByName || '',
    createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.createdAt instanceof Date ? data.createdAt : new Date(),
    recalledAt: data.recalledAt instanceof Timestamp
        ? data.recalledAt.toDate()
        : data.recalledAt instanceof Date ? data.recalledAt : null,
    recalledByName: data.recalledByName || undefined,
})

const toReceipt = (data: Record<string, any>): AnnouncementReceipt => ({
    announcementId: data.announcementId || '',
    uid: data.uid || '',
    state: data.state === 'dismissed' ? 'dismissed' : 'seen',
    seenAt: data.seenAt instanceof Timestamp ? data.seenAt.toDate() : new Date(),
    dismissedAt: data.dismissedAt instanceof Timestamp ? data.dismissedAt.toDate() : undefined,
    recalledAckAt: data.recalledAckAt instanceof Timestamp ? data.recalledAckAt.toDate() : undefined,
})

/**
 * Where a person's read receipt for one announcement lives.
 *
 * Flat under the hotel and keyed by both ids, rather than a subcollection of each announcement.
 * A subcollection can only be read back with a collection group query, and Firestore will not
 * authorise that against a hotel scoped rule, because the hotel in the path is a wildcard for a
 * collection group. The query is rejected, the subscription never delivers, and read receipts
 * silently never work. Keeping the hotel in the path makes both reads provable.
 */
const receiptDocId = (announcementId: string, uid: string) => `${announcementId}__${uid}`

const receiptDoc = (hotelId: string, announcementId: string, uid: string) =>
    doc(db, 'hotels', hotelId, 'announcement_receipts', receiptDocId(announcementId, uid))

const receiptFields = (announcementId: string, uid: string, state: AnnouncementReceipt['state']) => ({
    announcementId,
    uid,
    state,
})

interface AnnouncementState {
    announcements: Announcement[]
    /** My own receipts, keyed by announcement id. */
    receipts: Record<string, AnnouncementReceipt>
    /** Audience receipts per announcement, read by admins only. */
    audience: Record<string, Record<string, AnnouncementReceipt>>
    loading: boolean
    receiptsLoaded: boolean
    error: string | null
}

interface AnnouncementActions {
    subscribeToAnnouncements: (hotelId: string) => () => void
    subscribeToMyReceipts: (hotelId: string, uid: string) => () => void
    subscribeToAudience: (hotelId: string, announcementId: string) => () => void
    publishAnnouncement: (hotelId: string, announcement: Omit<Announcement, 'id' | 'createdAt' | 'recalledAt'>) => Promise<void>
    markSeen: (hotelId: string, announcementId: string, uid: string) => Promise<void>
    markDismissed: (hotelId: string, announcementId: string, uid: string) => Promise<void>
    acknowledgeRecall: (hotelId: string, announcementId: string, uid: string) => Promise<void>
    recallAnnouncement: (hotelId: string, announcementId: string, byName: string) => Promise<void>
    restoreAnnouncement: (hotelId: string, announcementId: string) => Promise<void>
    purgeAnnouncement: (hotelId: string, announcementId: string) => Promise<void>
}

type AnnouncementStore = AnnouncementState & AnnouncementActions

/** Demo data lives at module scope so every subscriber sees the same announcements. */
let demoAnnouncements: Announcement[] = [
    {
        id: 'demo-ann-1',
        title: 'Ramazan servisi değişikliği',
        content: 'Ramazan ayı boyunca kahvaltı servisi 06:30 - 08:00 arasında sunulacak. Ekibin bu saatlerde hazır olmasını rica ederiz.',
        audience: 'all',
        createdBy: 'demo-user-gm',
        createdByName: 'Demo Manager',
        createdAt: new Date(Date.now() - 1000 * 60 * 42),
        recalledAt: null,
    },
    {
        id: 'demo-ann-2',
        title: 'Oda 214 hakkında',
        content: 'Oda 214 misafirlerine ekstra yastık talebi geldi. Lütfen odaya girmeden önce hazırlayın.',
        audience: 'selected',
        recipientIds: ['demo-user-staff'],
        recipientNames: ['Demo Staff'],
        createdBy: 'demo-user-gm',
        createdByName: 'Demo Manager',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
        recalledAt: null,
    },
]
let demoReceipts: Record<string, Record<string, AnnouncementReceipt>> = {
    'demo-ann-1': {
        'demo-user-staff': {
            announcementId: 'demo-ann-1',
            uid: 'demo-user-staff',
            state: 'dismissed',
            seenAt: new Date(Date.now() - 1000 * 60 * 30),
            dismissedAt: new Date(Date.now() - 1000 * 60 * 28),
        },
    },
}
let demoViewer = ''

/**
 * Clears the module scoped demo viewer. Without this the previous account's uid stays in
 * `demoViewer`, and a later writeDemoReceipt would record a read against someone who has
 * already signed out.
 */
export function clearAnnouncementDemoViewer() {
    demoViewer = ''
}

const receiptsFor = (announcementId: string) => demoReceipts[announcementId] || {}

function myDemoReceipts(uid: string) {
    const mine: Record<string, AnnouncementReceipt> = {}
    for (const [announcementId, byUser] of Object.entries(demoReceipts)) {
        if (byUser[uid]) mine[announcementId] = byUser[uid]
    }
    return mine
}

/** Mutates the demo receipts and returns the viewer's fresh receipt map, or null if nobody is viewing. */
const writeDemoReceipt = (announcementId: string, uid: string, state: AnnouncementReceipt['state']) => {
    const existing = receiptsFor(announcementId)[uid]
    const now = new Date()
    demoReceipts = {
        ...demoReceipts,
        [announcementId]: {
            ...receiptsFor(announcementId),
            [uid]: {
                announcementId,
                uid,
                state,
                seenAt: existing?.seenAt || now,
                dismissedAt: state === 'dismissed' ? now : undefined,
            },
        },
    }
    return demoViewer ? myDemoReceipts(demoViewer) : null
}

export const useAnnouncementStore = create<AnnouncementStore>((set) => ({
    announcements: [],
    receipts: {},
    audience: {},
    loading: true,
    receiptsLoaded: false,
    error: null,

    subscribeToAnnouncements: (hotelId) => {
        set({ loading: true, error: null })

        if (hotelId === DEMO_HOTEL_ID || hotelId.includes('demo')) {
            set({ announcements: demoAnnouncements, loading: false, error: null })
            return () => { }
        }

        const q = query(
            collection(db, 'hotels', hotelId, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(500),
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            set({
                announcements: snapshot.docs.map((entry) => toAnnouncement(entry.id, entry.data())).reverse(),
                loading: false,
            })
        }, (err) => {
            if (err.code !== 'permission-denied') {
                console.error("Announcement subscription error:", err)
            }
            set({ error: err.message, loading: false })
        })
        return unsubscribe
    },

    subscribeToMyReceipts: (hotelId, uid) => {
        if (!hotelId || !uid) return () => { }
        if (hotelId === DEMO_HOTEL_ID || hotelId.includes('demo')) {
            demoViewer = uid
            set({ receipts: myDemoReceipts(uid), receiptsLoaded: true })
            return () => { }
        }
        set({ receiptsLoaded: false })
        const q = query(
            collection(db, 'hotels', hotelId, 'announcement_receipts'),
            where('uid', '==', uid),
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const next: Record<string, AnnouncementReceipt> = {}
            for (const entry of snapshot.docs) {
                const receipt = toReceipt(entry.data())
                if (receipt.announcementId) next[receipt.announcementId] = receipt
            }
            set({ receipts: next, receiptsLoaded: true })
        }, (err) => {
            if (err.code !== 'permission-denied') {
                console.error("Announcement receipt subscription error:", err)
            }
            set({ error: err.message, receiptsLoaded: true })
        })
        return unsubscribe
    },

    subscribeToAudience: (hotelId, announcementId) => {
        if (hotelId === DEMO_HOTEL_ID) {
            set((state) => ({ audience: { ...state.audience, [announcementId]: receiptsFor(announcementId) } }))
            return () => { }
        }
        const q = query(
            collection(db, 'hotels', hotelId, 'announcement_receipts'),
            where('announcementId', '==', announcementId),
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const next: Record<string, AnnouncementReceipt> = {}
            for (const entry of snapshot.docs) {
                const receipt = toReceipt(entry.data())
                // The document id is {announcementId}__{uid}, so it must not be used as the person.
                // The uid comes from the stored field, which the rules require to be present.
                if (receipt.uid) next[receipt.uid] = receipt
            }
            set((state) => ({ audience: { ...state.audience, [announcementId]: next } }))
        }, (err) => {
            console.error("Announcement audience error:", err)
        })
        return unsubscribe
    },

    publishAnnouncement: async (hotelId, announcement) => {
        if (hotelId === DEMO_HOTEL_ID) {
            const created: Announcement = { ...announcement, id: `demo-ann-${Date.now()}`, createdAt: new Date(), recalledAt: null }
            demoAnnouncements = [created, ...demoAnnouncements]
            set({ announcements: demoAnnouncements })
            return
        }
        await addDoc(collection(db, 'hotels', hotelId, 'announcements'), {
            ...Object.fromEntries(Object.entries(announcement).filter(([, value]) => value !== undefined)),
            createdAt: serverTimestamp(),
            recalledAt: null,
        })
    },

    markSeen: async (hotelId, announcementId, uid) => {
        if (!hotelId || !uid) return
        const isDemo = hotelId === DEMO_HOTEL_ID || hotelId.includes('demo')
        if (isDemo) {
            // A closed announcement must not be downgraded back to merely seen.
            if (receiptsFor(announcementId)[uid]?.state === 'dismissed') return
            const mine = writeDemoReceipt(announcementId, uid, 'seen')
            if (mine) set({ receipts: mine })
            return
        }

        const existing = (useAnnouncementStore.getState().receipts || {})[announcementId]
        if (existing?.state === 'dismissed') return

        const now = new Date()
        const updatedReceipt: AnnouncementReceipt = {
            announcementId,
            uid,
            state: 'seen',
            seenAt: existing?.seenAt || now,
            dismissedAt: existing?.dismissedAt,
            recalledAckAt: existing?.recalledAckAt,
        }
        set((state) => ({
            receipts: {
                ...state.receipts,
                [announcementId]: updatedReceipt,
            },
        }))

        try {
            await runTransaction(db, async (tx) => {
                const ref = receiptDoc(hotelId, announcementId, uid)
                const existingDoc = await tx.get(ref)
                const data = existingDoc.exists() ? existingDoc.data() : undefined
                if (data?.state === 'dismissed') return

                const fields: Record<string, unknown> = { ...receiptFields(announcementId, uid, 'seen') }
                // Only set when absent, so the first opening is the one that is kept.
                if (!data?.seenAt) fields.seenAt = serverTimestamp()
                tx.set(ref, fields, { merge: true })
            })
        } catch (err) {
            console.error("Failed to mark announcement seen:", err)
        }
    },

    markDismissed: async (hotelId, announcementId, uid) => {
        if (!hotelId || !uid) return
        const isDemo = hotelId === DEMO_HOTEL_ID || hotelId.includes('demo')
        if (isDemo) {
            const mine = writeDemoReceipt(announcementId, uid, 'dismissed')
            if (mine) set({ receipts: mine })
            return
        }

        const existing = (useAnnouncementStore.getState().receipts || {})[announcementId]
        const now = new Date()
        const updatedReceipt: AnnouncementReceipt = {
            announcementId,
            uid,
            state: 'dismissed',
            seenAt: existing?.seenAt || now,
            dismissedAt: now,
            recalledAckAt: existing?.recalledAckAt,
        }
        set((state) => ({
            receipts: {
                ...state.receipts,
                [announcementId]: updatedReceipt,
            },
        }))

        try {
            await setDoc(receiptDoc(hotelId, announcementId, uid), {
                ...receiptFields(announcementId, uid, 'dismissed'),
                dismissedAt: serverTimestamp(),
            }, { merge: true })
        } catch (err) {
            console.error("Failed to mark announcement dismissed:", err)
        }
    },

    /**
     * Records that this person was told the announcement they had read was withdrawn. It is a
     * separate field rather than a new receipt state, because what the reader did with the original
     * announcement and what they did with the retraction are two different facts to audit.
     */
    acknowledgeRecall: async (hotelId, announcementId, uid) => {
        if (!uid) return
        const isDemo = hotelId === DEMO_HOTEL_ID || hotelId.includes('demo')
        if (isDemo) {
            const existing = receiptsFor(announcementId)[uid]
            if (!existing || existing.recalledAckAt) return
            demoReceipts = {
                ...demoReceipts,
                [announcementId]: {
                    ...receiptsFor(announcementId),
                    [uid]: { ...existing, recalledAckAt: new Date() },
                },
            }
            if (demoViewer) set({ receipts: myDemoReceipts(demoViewer) })
            set((state) => ({ audience: { ...state.audience, [announcementId]: receiptsFor(announcementId) } }))
            return
        }

        const existing = (useAnnouncementStore.getState().receipts || {})[announcementId]
        if (existing) {
            set((state) => ({
                receipts: {
                    ...state.receipts,
                    [announcementId]: { ...existing, recalledAckAt: new Date() },
                },
            }))
        }

        // updateDoc, not a merging set: acknowledging presupposes a receipt already exists, and a
        // merge would quietly create a half filled one that the rules then reject anyway. Failing
        // outright is the honest outcome.
        await updateDoc(receiptDoc(hotelId, announcementId, uid), {
            recalledAckAt: serverTimestamp(),
        })
    },

    recallAnnouncement: async (hotelId, announcementId, byName) => {        if (hotelId === DEMO_HOTEL_ID) {
            demoAnnouncements = demoAnnouncements.map((item) => item.id === announcementId
                ? { ...item, recalledAt: new Date(), recalledByName: byName }
                : item)
            set({ announcements: demoAnnouncements })
            return
        }
        await updateDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId), {
            recalledAt: serverTimestamp(),
            recalledByName: byName,
        })
    },

    restoreAnnouncement: async (hotelId, announcementId) => {
        if (hotelId === DEMO_HOTEL_ID) {
            demoAnnouncements = demoAnnouncements.map((item) => item.id === announcementId
                ? { ...item, recalledAt: null, recalledByName: undefined }
                : item)
            set({ announcements: demoAnnouncements })
            return
        }
        await updateDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId), {
            recalledAt: null,
            recalledByName: null,
        })
    },

    purgeAnnouncement: async (hotelId, announcementId) => {
        if (hotelId === DEMO_HOTEL_ID) {
            demoAnnouncements = demoAnnouncements.filter((item) => item.id !== announcementId)
            delete demoReceipts[announcementId]
            set({ announcements: demoAnnouncements })
            return
        }
        // The receipts have to go with it. They used to sit under the announcement, so deleting the
        // parent left them behind with no way to reach or clean them, and every purge leaked one
        // orphaned receipt set per reader. Now they are addressable, so they are removed here.
        // The announcement is deleted last: if the receipt sweep fails, the announcement is still
        // there and the purge can be retried, rather than the other way round leaving nothing to
        // retry against.
        const receipts = await getDocs(query(
            collection(db, 'hotels', hotelId, 'announcement_receipts'),
            where('announcementId', '==', announcementId),
        ))
        const batch = writeBatch(db)
        for (const receipt of receipts.docs) batch.delete(receipt.ref)
        batch.delete(doc(db, 'hotels', hotelId, 'announcements', announcementId))
        await batch.commit()

        set((state) => {
            const audience = { ...state.audience }
            delete audience[announcementId]
            const receipts_ = { ...state.receipts }
            delete receipts_[announcementId]
            return { audience, receipts: receipts_ }
        })
    },
}))

if (typeof window !== 'undefined') {
    ;(window as any).useAnnouncementStore = useAnnouncementStore
}
