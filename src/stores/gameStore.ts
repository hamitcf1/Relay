import { create } from 'zustand'
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot,
    serverTimestamp,
    getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ScoreEntry {
    id: string
    userId: string
    userName: string
    score: number
    gameType: string
    timestamp: any
}

interface GameState {
    scores: ScoreEntry[]
    loading: boolean
    error: string | null
}

interface GameActions {
    submitScore: (hotelId: string, userId: string, userName: string, score: number, gameType: string) => Promise<void>
    subscribeToScores: (hotelId: string, gameType: string) => () => void
}

type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>((set) => ({
    scores: [],
    loading: false,
    error: null,

    submitScore: async (hotelId, userId, userName, score, gameType) => {
        try {
            const scoresRef = collection(db, 'hotels', hotelId, 'scores')
            
            // For reaction-time, lower is better. For others (like clicker), higher is better.
            const isLowerBetter = gameType === 'reaction-time'

            // Check if user already has a high score for this game
            const q = query(
                scoresRef,
                where('userId', '==', userId),
                where('gameType', '==', gameType),
                orderBy('score', isLowerBetter ? 'asc' : 'desc'),
                limit(1)
            )
            const snap = await getDocs(q)
            
            if (!snap.empty) {
                const best = snap.docs[0].data().score
                if (isLowerBetter) {
                    if (score >= best) return // Don't save if slower
                } else {
                    if (score <= best) return // Don't save if lower
                }
            }

            await addDoc(scoresRef, {
                userId,
                userName,
                score,
                gameType,
                timestamp: serverTimestamp()
            })
        } catch (error: any) {
            console.error('Error submitting score:', error)
        }
    },

    subscribeToScores: (hotelId, gameType) => {
        if (!hotelId) return () => {}
        set({ loading: true })
        const scoresRef = collection(db, 'hotels', hotelId, 'scores')
        const isLowerBetter = gameType === 'reaction-time'
        
        const q = query(
            scoresRef,
            where('gameType', '==', gameType),
            orderBy('score', isLowerBetter ? 'asc' : 'desc'),
            limit(10)
        )

        return onSnapshot(q, (snapshot) => {
            const scores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ScoreEntry[]
            set({ scores, loading: false })
        }, (error) => {
            set({ error: error.message, loading: false })
        })
    }
}))
