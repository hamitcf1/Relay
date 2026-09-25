import { create } from 'zustand'
import {
    addDoc,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
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

const toReceipt = (announcementId: string, uid: string, data: Record<string, any>): AnnouncementReceipt => ({
    announcementId,
    uid,
    state: data.state === 'dismissed' ? 'dismissed' : 'seen',
    seenAt: data.seenAt instanceof Timestamp ? data.seenAt.toDate() : new Date(),
    dismissedAt: data.dismissedAt instanceof Timestamp ? data.dismissedAt.toDate() : undefined,
    recalledAckAt: data.recalledAckAt instanceof Timestamp ? data.recalledAckAt.toDate() : undefined,
})

interface AnnouncementState {
    announcements: Announcement[]
    /** My own receipts, keyed by announcement id. */
    receipts: Record<string, AnnouncementReceipt>
    /** Audience receipts per announcement, read by admins only. */
    audience: Record<string, Record<string, AnnouncementReceipt>>
    loading: boolean
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
    error: null,

    subscribeToAnnouncements: (hotelId) => {
        set({ loading: true, error: null })

        if (hotelId === DEMO_HOTEL_ID) {
            set({ announcements: demoAnnouncements, loading: false, error: null })
            return () => { }
        }

        const q = query(
            collection(db, 'hotels', hotelId, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(50),
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            set({
                announcements: snapshot.docs.map((entry) => toAnnouncement(entry.id, entry.data())).reverse(),
                loading: false,
            })
        }, (err) => {
            console.error("Announcement subscription error:", err)
            set({ error: err.message, loading: false })
        })
        return unsubscribe
    },

    subscribeToMyReceipts: (hotelId, uid) => {
        if (!uid) return () => { }
        if (hotelId === DEMO_HOTEL_ID) {
            demoViewer = uid
            set({ receipts: myDemoReceipts(uid) })
            return () => { }
        }
        // Receipts live under each announcement, so a single listener covers every one. The query
        // spans hotels, so the result is narrowed to this one before it reaches the store.
        const prefix = `hotels/${hotelId}/announcements/`
        const q = query(collectionGroup(db, 'receipts'), where('uid', '==', uid), limit(200))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const next: Record<string, AnnouncementReceipt> = {}
            for (const entry of snapshot.docs) {
                if (!entry.ref.path.startsWith(prefix)) continue
                const announcementId = entry.ref.parent.parent?.id
                if (announcementId) next[announcementId] = toReceipt(announcementId, uid, entry.data())
            }
            set({ receipts: next })
        }, (err) => {
            console.error("Announcement receipt subscription error:", err)
        })
        return unsubscribe
    },

    subscribeToAudience: (hotelId, announcementId) => {
        if (hotelId === DEMO_HOTEL_ID) {
            set((state) => ({ audience: { ...state.audience, [announcementId]: receiptsFor(announcementId) } }))
            return () => { }
        }
        const q = collection(db, 'hotels', hotelId, 'announcements', announcementId, 'receipts')
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const next: Record<string, AnnouncementReceipt> = {}
            for (const entry of snapshot.docs) next[entry.id] = toReceipt(announcementId, entry.id, entry.data())
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
        if (!uid) return
        if (hotelId === DEMO_HOTEL_ID) {
            // A closed announcement must not be downgraded back to merely seen.
            if (receiptsFor(announcementId)[uid]?.state === 'dismissed') return
            const mine = writeDemoReceipt(announcementId, uid, 'seen')
            if (mine) set({ receipts: mine })
            return
        }
        await setDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId, 'receipts', uid), {
            uid,
            state: 'seen',
            seenAt: serverTimestamp(),
        }, { merge: true })
    },

    markDismissed: async (hotelId, announcementId, uid) => {
        if (!uid) return
        if (hotelId === DEMO_HOTEL_ID) {
            const mine = writeDemoReceipt(announcementId, uid, 'dismissed')
            if (mine) set({ receipts: mine })
            return
        }
        await setDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId, 'receipts', uid), {
            uid,
            state: 'dismissed',
            seenAt: serverTimestamp(),
            dismissedAt: serverTimestamp(),
        }, { merge: true })
    },

    /**
     * Records that this person was told the announcement they had read was withdrawn. It is a
     * separate field rather than a new receipt state, because what the reader did with the original
     * announcement and what they did with the retraction are two different facts to audit.
     */
    acknowledgeRecall: async (hotelId, announcementId, uid) => {
        if (!uid) return
        if (hotelId === DEMO_HOTEL_ID) {
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
        await updateDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId, 'receipts', uid), {
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
        await deleteDoc(doc(db, 'hotels', hotelId, 'announcements', announcementId))
    },
}))

if (typeof window !== 'undefined') {
    ;(window as any).useAnnouncementStore = useAnnouncementStore
}
