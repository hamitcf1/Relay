import { create } from 'zustand'
import { collection, getDocs, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, addDays, parseISO } from 'date-fns'

export type ShiftType = 'A' | 'B' | 'C' | 'E' | 'OFF'

interface StaffMember {
    uid: string
    name: string
    role?: string
    is_hidden_in_roster?: boolean
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
    toggleStaffVisibility: (hotelId: string, userId: string, isHidden: boolean) => Promise<void>
}

type RosterStore = RosterState & RosterActions

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHIFT_PRIORITY: Record<string, number> = { 'A': 1, 'E': 2, 'B': 3, 'C': 4 }

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

            // Fetch staff details if missing OR if we want to ensure we have latest hidden status
            // For simplicity, we re-fetch staff list to catch 'is_hidden_in_roster' updates
            // (In a minimal read optimized app, we'd only do this on change, but this is fine for now)
            try {
                const usersRef = collection(db, 'users')
                const q = query(usersRef, where('hotel_id', '==', hotelId))
                const userSnap = await getDocs(q)
                const staffList: StaffMember[] = []

                userSnap.forEach(uDoc => {
                    const uData = uDoc.data()
                    if (uData.name && uData.name !== 'Unknown') {
                        staffList.push({
                            uid: uDoc.id,
                            name: uData.name,
                            role: uData.role,
                            is_hidden_in_roster: uData.is_hidden_in_roster
                        })
                    }
                })
                set({ staff: staffList })
            } catch (e) {
                console.error("Failed to fetch staff details", e)
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
            // NOTE: We do NOT filter hidden staff here because this input is used by components
            // that might need to show them (like GM view). Filtering should happen at UI level
            // OR we add a parameter to this function. For now, we return all. 
            // Actually, for "Current Shift" display, we probably should filter hidden ones if not GM?
            // Let's stick to returning all and letting UI decide.

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

        // Sort by shift priority A -> E -> B -> C
        return result.sort((a, b) => {
            const priorityA = SHIFT_PRIORITY[a.shift] || 99
            const priorityB = SHIFT_PRIORITY[b.shift] || 99
            return priorityA - priorityB
        })
    },

    toggleStaffVisibility: async (_hotelId: string, userId: string, isHidden: boolean) => {
        try {
            const userRef = doc(db, 'users', userId)
            await updateDoc(userRef, {
                is_hidden_in_roster: isHidden
            })
            // Refetch staff to update UI immediately
            const { staff } = get()
            const updatedStaff = staff.map(s => s.uid === userId ? { ...s, is_hidden_in_roster: isHidden } : s)
            set({ staff: updatedStaff })
        } catch (error) {
            console.error("Error toggling staff visibility:", error)
            throw error
        }
    }
}))
