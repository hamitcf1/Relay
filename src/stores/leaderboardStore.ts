import { create } from 'zustand'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActivityLog } from '@/types'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface LeaderboardEntry {
    userId: string
    userName: string
    totalMinutes: number
    rank: number
}

interface LeaderboardState {
    entries: LeaderboardEntry[]
    loading: boolean
    error: string | null
    timeRange: 'day' | 'week'
}

interface LeaderboardActions {
    setTimeRange: (range: 'day' | 'week') => void
    loadLeaderboard: (hotelId: string) => Promise<void>
}

type LeaderboardStore = LeaderboardState & LeaderboardActions

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
    entries: [],
    loading: false,
    error: null,
    timeRange: 'week',

    setTimeRange: (range) => set({ timeRange: range }),

    loadLeaderboard: async (hotelId) => {
        set({ loading: true, error: null })
        const { timeRange } = get()

        try {
            const now = new Date()
            let startDateStr = ''
            let endDateStr = ''

            if (timeRange === 'day') {
                startDateStr = format(now, 'yyyy-MM-dd')
                endDateStr = startDateStr
            } else {
                const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
                const end = endOfWeek(now, { weekStartsOn: 1 })
                startDateStr = format(start, 'yyyy-MM-dd')
                endDateStr = format(end, 'yyyy-MM-dd')
            }

            // We need to query activity_logs for this hotel within date range
            // Firestore doesn't support aggregation easily across multiple docs without aggregation queries (which are valid but let's stick to simple client-side agg for small hotels)
            // Hotels usually have < 50 staff, so fetching logs for a week is ~50 * 7 = 350 docs max. Feasible.

            const logsRef = collection(db, 'hotels', hotelId, 'activity_logs')
            const q = query(
                logsRef,
                where('date', '>=', startDateStr),
                where('date', '<=', endDateStr)
            )

            const snapshot = await getDocs(q)

            const userTotals: Record<string, { name: string, minutes: number }> = {}

            snapshot.forEach(doc => {
                const data = doc.data() as ActivityLog
                if (!userTotals[data.user_id]) {
                    userTotals[data.user_id] = { name: data.user_name, minutes: 0 }
                }
                userTotals[data.user_id].minutes += data.total_active_minutes
            })

            // Convert to array and sort
            const sortedEntries = Object.entries(userTotals)
                .map(([userId, data]) => ({
                    userId,
                    userName: data.name,
                    totalMinutes: Math.round(data.minutes),
                    rank: 0
                }))
                .sort((a, b) => b.totalMinutes - a.totalMinutes)
                .map((entry, index) => ({ ...entry, rank: index + 1 }))

            set({ entries: sortedEntries, loading: false })

        } catch (error) {
            console.error("Error loading leaderboard:", error)
            set({ error: (error as Error).message, loading: false })
        }
    }
}))
