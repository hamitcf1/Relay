import { create } from 'zustand'
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, addDays, parseISO } from 'date-fns'

import { type StaffMember } from '@/types'

export type ShiftType = 'A' | 'B' | 'C' | 'E' | 'OFF'

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

        // Mock Roster for Live Demo
        if (hotelId === 'demo-hotel-id') {
            const startOfCurrentWeek = new Date() // Simplified for demo

            const mockSchedule: Record<string, Record<string, ShiftType>> = {
                'demo-user-gm': {},
                'demo-user-staff': {}
            }

            // Populate mock schedule for this week
            for (let i = 0; i < 7; i++) {
                const date = addDays(startOfCurrentWeek, i - startOfCurrentWeek.getDay() + 1) // Rough approximation of week
                const dateKey = format(date, 'yyyy-MM-dd')
                mockSchedule['demo-user-gm'][dateKey] = 'A'
                mockSchedule['demo-user-staff'][dateKey] = i % 2 === 0 ? 'B' : 'A'
            }

            set({
                staff: [
                    { uid: 'demo-user-gm', name: 'Demo Manager', role: 'gm' },
                    { uid: 'demo-user-staff', name: 'Demo Staff', role: 'receptionist' }
                ],
                schedule: mockSchedule,
                loading: false,
                error: null
            })
            return () => { }
        }

        // 1. Reactive Staff Subscription (ensures avatar emoji updates are instant for everyone)
        const usersRef = collection(db, 'users')
        const usersQuery = query(usersRef, where('hotel_id', '==', hotelId))

        const unsubscribeStaff = onSnapshot(usersQuery, (userSnap) => {
            const staffList: StaffMember[] = []
            userSnap.forEach(uDoc => {
                const uData = uDoc.data()
                if (uData.name && uData.name !== 'Unknown') {
                    staffList.push({
                        uid: uDoc.id,
                        name: uData.name,
                        role: uData.role,
                        is_hidden_in_roster: uData.is_hidden_in_roster,
                        settings: uData.settings
                    })
                }
            })
            set({ staff: staffList })
        }, (err) => {
            console.error("Staff subscription error", err)
        })

        // 2. Roster Schedule Subscription
        const unsubscribeRoster = onSnapshot(rosterRef, (snapshot) => {
            const newSchedule: Record<string, Record<string, ShiftType>> = {}

            snapshot.docs.forEach(doc => {
                const weekStartStr = doc.id // "2026-02-02"
                const data = doc.data() as { schedule: Record<string, Record<string, ShiftType>> }

                if (!data.schedule) return

                Object.entries(data.schedule).forEach(([uid, userWeek]) => {
                    if (!newSchedule[uid]) newSchedule[uid] = {}

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

            set({ schedule: newSchedule, loading: false })
        }, (err) => {
            console.error("Roster subscription error", err)
            set({ error: err.message })
        })

        return () => {
            unsubscribeStaff()
            unsubscribeRoster()
        }
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
            const { staff } = get()
            const updatedStaff = staff.map(s => s.uid === userId ? { ...s, is_hidden_in_roster: isHidden } : s)
            set({ staff: updatedStaff })
        } catch (error) {
            console.error("Error toggling staff visibility:", error)
            throw error
        }
    }
}))
