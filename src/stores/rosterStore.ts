import { create } from 'zustand'
import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, addDays, parseISO } from 'date-fns'

export type ShiftType = 'A' | 'B' | 'C' | 'E' | 'OFF'

interface StaffMember {
    uid: string
    name: string
    role?: string
}

interface RosterState {
    staff: StaffMember[]
    schedule: Record<string, Record<string, ShiftType>> // [uid][yyyy-MM-dd] -> Shift
    loading: boolean
    error: string | null
}

interface RosterActions {
    subscribeToRoster: (hotelId: string) => () => void
    getShiftsForDate: (date: Date) => Array<{ name: string; shift: ShiftType; uid: string }>
}

type RosterStore = RosterState & RosterActions

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const useRosterStore = create<RosterStore>((set, get) => ({
    staff: [],
    schedule: {},
    loading: true,
    error: null,

    subscribeToRoster: (hotelId: string) => {
        set({ loading: true, error: null })

        const rosterRef = collection(db, 'hotels', hotelId, 'roster')

        const unsubscribe = onSnapshot(rosterRef, async (snapshot) => {
            const newSchedule: Record<string, Record<string, ShiftType>> = {}
            const userIds = new Set<string>()

            snapshot.docs.forEach(doc => {
                const weekStartStr = doc.id // "2026-02-02"
                const data = doc.data() as { schedule: Record<string, Record<string, ShiftType>> }

                if (!data.schedule) return

                // Iterate users in this week's schedule
                Object.entries(data.schedule).forEach(([uid, userWeek]) => {
                    userIds.add(uid)
                    if (!newSchedule[uid]) newSchedule[uid] = {}

                    // Iterate days (Mon, Tue...) and map to actual dates
                    DAYS.forEach((day, index) => {
                        const shift = userWeek[day]
                        if (shift) {
                            try {
                                const weekStart = parseISO(weekStartStr)
                                const shiftDate = addDays(weekStart, index)
                                const dateKey = format(shiftDate, 'yyyy-MM-dd')
                                newSchedule[uid][dateKey] = shift
                            } catch (e) {
                                console.error("Error parsing date for roster:", weekStartStr, e)
                            }
                        }
                    })
                })
            })

            // Fetch staff details if missing
            // Optimize: Only fetch if we have UIDs that are not in current staff list
            const currentStaffIds = get().staff.map(s => s.uid)
            const missingIds = Array.from(userIds).filter(id => !currentStaffIds.includes(id))

            if (missingIds.length > 0) {
                try {
                    // We can't fetch strictly by ID list easily if it's large.
                    // But we can just fetch all hotel users again to be safe and simple.
                    const usersRef = collection(db, 'users')
                    const q = query(usersRef, where('hotel_id', '==', hotelId))
                    const userSnap = await getDocs(q)
                    const staffList: StaffMember[] = []

                    userSnap.forEach(uDoc => {
                        const uData = uDoc.data()
                        staffList.push({
                            uid: uDoc.id,
                            name: uData.name || 'Unknown',
                            role: uData.role
                        })
                    })
                    set({ staff: staffList })
                } catch (e) {
                    console.error("Failed to fetch staff details", e)
                }
            }

            set({ schedule: newSchedule, loading: false })
        }, (err) => {
            console.error("Roster subscription error", err)
            set({ error: err.message })
        })

        return unsubscribe
    },

    getShiftsForDate: (date: Date) => {
        const { schedule, staff } = get()
        const dateKey = format(date, 'yyyy-MM-dd')
        const result: Array<{ name: string; shift: ShiftType; uid: string }> = []

        staff.forEach(member => {
            const userShifts = schedule[member.uid]
            if (userShifts && userShifts[dateKey]) {
                const shift = userShifts[dateKey]
                if (shift !== 'OFF') {
                    result.push({
                        name: member.name,
                        shift: shift,
                        uid: member.uid
                    })
                }
            }
        })

        return result
    }
}))
