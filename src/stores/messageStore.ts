import { create } from 'zustand'
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    Timestamp,
    limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PrivateMessage } from '@/types'

interface MessageState {
    messages: PrivateMessage[]
    loading: boolean
    error: string | null
}

interface MessageActions {
    subscribeToMessages: (hotelId: string, userId: string) => () => void
    sendMessage: (hotelId: string, message: Omit<PrivateMessage, 'id' | 'timestamp' | 'is_read'>) => Promise<void>
    markAsRead: (hotelId: string, messageId: string) => Promise<void>
    deleteMessage: (hotelId: string, messageId: string) => Promise<void>
}

type MessageStore = MessageState & MessageActions

export const useMessageStore = create<MessageStore>((set) => ({
    messages: [],
    loading: true,
    error: null,

    subscribeToMessages: (hotelId, userId) => {
        set({ loading: true, error: null })

        const messagesRef = collection(db, 'hotels', hotelId, 'messages')

        // Query messages where user is either sender or receiver
        // Firestore doesn't support "OR" easily, so we'll query for hotel and filter
        // or just subscribe to messages where receiver is global 'gm' or the user.
        const q = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMessages: PrivateMessage[] = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    sender_id: data.sender_id,
                    sender_name: data.sender_name,
                    receiver_id: data.receiver_id,
                    content: data.content,
                    timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
                    is_read: data.is_read || false
                }
            })

            // Filter: messages involve the user (sender or receiver)
            // If user is GM, they see all staff-to-gm messages.
            const filtered = allMessages.filter(m =>
                m.sender_id === userId ||
                m.receiver_id === userId ||
                m.receiver_id === 'gm' ||
                m.receiver_id === 'all'
            )

            // Reverse to show oldest first (chronological order)
            set({ messages: filtered.reverse(), loading: false })
        }, (err) => {
            console.error("Message subscription error:", err)
            set({ error: err.message, loading: false })
        })

        return unsubscribe
    },

    sendMessage: async (hotelId, message) => {
        try {
            const messagesRef = collection(db, 'hotels', hotelId, 'messages')
            await addDoc(messagesRef, {
                ...message,
                timestamp: serverTimestamp(),
                is_read: false
            })
        } catch (error: any) {
            console.error("Error sending message:", error)
            throw error
        }
    },

    markAsRead: async (hotelId, messageId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'messages', messageId)
            await updateDoc(docRef, { is_read: true })
        } catch (error: any) {
            console.error("Error marking message as read:", error)
        }
    },
    deleteMessage: async (hotelId, messageId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'messages', messageId)
            await deleteDoc(docRef)
        } catch (error: any) {
            console.error("Error deleting message:", error)
        }
    }
}))
