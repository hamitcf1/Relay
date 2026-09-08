import { create } from 'zustand'
import { collection, onSnapshot, query, where, doc, updateDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, addDays, parseISO } from 'date-fns'

import { type StaffMember, type RosterCellEdit, type RosterDraft, type RosterDraftCell, type RosterShiftValue } from '@/types'
import { useAuthStore } from './authStore'

export type ShiftType = 'A' | 'B' | 'C' | 'E' | 'OFF'

interface RosterState {
    staff: StaffMember[]
    activeStaff: StaffMember[]
    schedule: Record<string, Record<string, ShiftType>> // [uid][yyyy-MM-dd] -> Shift
    loading: boolean
    error: string | null
    draft: RosterDraft | null
    draftSaving: boolean
    draftConflict: string | null
}

interface RosterActions {
    subscribeToRoster: (hotelId: string) => () => void
    getShiftsForDate: (date: Date) => Array<{ name: string; shift: ShiftType; uid: string }>
    toggleStaffVisibility: (hotelId: string, userId: string, isHidden: boolean) => Promise<void>
    subscribeToDraft: (hotelId: string, weekId: string) => () => void
    updateDraftCell: (hotelId: string, weekId: string, edit: RosterCellEdit) => Promise<'saved' | 'conflict'>
    publishRoster: (hotelId: string, weekId: string, expectedDraftVersion: number) => Promise<'published' | 'conflict'>
}

type RosterStore = RosterState & RosterActions

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHIFT_PRIORITY: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'E': 4 }

export const useRosterStore = create<RosterStore>((set, get) => ({
    staff: [],
    activeStaff: [],
    schedule: {},
    loading: true,
    error: null,
    draft: null,
    draftSaving: false,
    draftConflict: null,

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
                    { uid: 'demo-user-gm', name: 'Demo Manager', role: 'gm', status: 'active' },
                    { uid: 'demo-user-staff', name: 'Demo Staff', role: 'receptionist', status: 'active' }
                ],
                activeStaff: [
                    { uid: 'demo-user-gm', name: 'Demo Manager', role: 'gm', status: 'active' },
                    { uid: 'demo-user-staff', name: 'Demo Staff', role: 'receptionist', status: 'active' }
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
                        settings: uData.settings,
                        status: uData.status || 'active',
                        deactivated_at: uData.deactivated_at
                    })
                }
            })
            set({ 
                staff: staffList,
                activeStaff: staffList.filter(s => s.status !== 'inactive')
            })
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
        const { schedule, activeStaff } = get()
        const dateKey = format(date, 'yyyy-MM-dd')
        const result: Array<{ name: string; shift: ShiftType; uid: string }> = []

        activeStaff.forEach(member => {
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

    subscribeToDraft: (hotelId, weekId) => {
        if (hotelId === 'demo-hotel-id') {
            set({ draft: { weekId, version: 0, cells: {}, updatedBy: '', updatedByName: '', updatedAt: new Date() } })
            return () => {}
        }
        return onSnapshot(doc(db, 'hotels', hotelId, 'roster_drafts', weekId), (snapshot) => {
            if (!snapshot.exists()) return set({ draft: { weekId, version: 0, cells: {}, updatedBy: '', updatedByName: '', updatedAt: new Date() } })
            const data = snapshot.data()
            const cells = Object.fromEntries(Object.entries(data.cells || {}).map(([key, raw]) => {
                const cell = raw as any
                return [key, { ...cell, updatedAt: cell.updatedAt instanceof Timestamp ? cell.updatedAt.toDate() : new Date() }]
            })) as Record<string, RosterDraftCell>
            set({ draft: { weekId, version: data.version || 0, cells, updatedBy: data.updatedBy || '', updatedByName: data.updatedByName || '', updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date() }, draftConflict: null })
        })
    },

    updateDraftCell: async (hotelId, weekId, edit) => {
        const actor = useAuthStore.getState().user
        if (!actor) return 'conflict'
        set({ draftSaving: true, draftConflict: null })
        if (hotelId === 'demo-hotel-id') {
            const current = get().draft || { weekId, version: 0, cells: {}, updatedBy: '', updatedByName: '', updatedAt: new Date() }
            const key = `${edit.staffId}:${edit.day}`
            const actual = current.cells[key]?.version || 0
            if (actual !== edit.expectedCellVersion) { set({ draftSaving: false, draftConflict: key }); return 'conflict' }
            set({ draft: { ...current, version: current.version + 1, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: new Date(), cells: { ...current.cells, [key]: { value: edit.value, version: actual + 1, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: new Date() } } }, draftSaving: false })
            return 'saved'
        }
        try {
            const draftRef = doc(db, 'hotels', hotelId, 'roster_drafts', weekId)
            const result = await runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(draftRef)
                const data = snapshot.data() || { version: 0, cells: {} }
                const key = `${edit.staffId}:${edit.day}`
                const actual = data.cells?.[key]?.version || 0
                if (actual !== edit.expectedCellVersion) return 'conflict' as const
                transaction.set(draftRef, { weekId, version: (data.version || 0) + 1, cells: { ...(data.cells || {}), [key]: { value: edit.value, version: actual + 1, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: serverTimestamp() } }, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: serverTimestamp() })
                return 'saved' as const
            })
            set({ draftSaving: false, draftConflict: result === 'conflict' ? `${edit.staffId}:${edit.day}` : null })
            return result
        } catch (error) { set({ draftSaving: false }); throw error }
    },

    publishRoster: async (hotelId, weekId, expectedDraftVersion) => {
        const actor = useAuthStore.getState().user
        const current = get().draft
        if (!actor || !current || current.version !== expectedDraftVersion) return 'conflict'
        const schedule: Record<string, Record<string, RosterShiftValue>> = {}
        Object.entries(current.cells).forEach(([key, cell]) => { const split = key.lastIndexOf(':'); const uid = key.slice(0, split); const day = key.slice(split + 1); schedule[uid] ||= {}; schedule[uid][day] = cell.value })
        if (hotelId === 'demo-hotel-id') { set({ draft: { ...current, cells: {}, version: current.version + 1, updatedAt: new Date() } }); return 'published' }
        const result = await runTransaction(db, async (transaction) => {
            const draftRef = doc(db, 'hotels', hotelId, 'roster_drafts', weekId)
            const rosterRef = doc(db, 'hotels', hotelId, 'roster', weekId)
            const snapshot = await transaction.get(draftRef)
            const rosterSnapshot = await transaction.get(rosterRef)
            if ((snapshot.data()?.version || 0) !== expectedDraftVersion) return 'conflict' as const
            const mergedSchedule = { ...(rosterSnapshot.data()?.schedule || {}) }
            Object.entries(schedule).forEach(([uid, days]) => { mergedSchedule[uid] = { ...(mergedSchedule[uid] || {}), ...days } })
            transaction.set(rosterRef, { week_start: weekId, version: expectedDraftVersion, schedule: mergedSchedule, publishedBy: actor.uid, publishedByName: actor.name, publishedAt: serverTimestamp() }, { merge: true })
            transaction.set(draftRef, { ...snapshot.data(), version: expectedDraftVersion + 1, cells: {}, updatedBy: actor.uid, updatedByName: actor.name, updatedAt: serverTimestamp() })
            return 'published' as const
        })
        return result
    },

    toggleStaffVisibility: async (_hotelId: string, userId: string, isHidden: boolean) => {
        try {
            const userRef = doc(db, 'users', userId)
            await updateDoc(userRef, {
                is_hidden_in_roster: isHidden
            })
            const { staff } = get()
            const updatedStaff = staff.map(s => s.uid === userId ? { ...s, is_hidden_in_roster: isHidden } : s)
            set({ 
                staff: updatedStaff,
                activeStaff: updatedStaff.filter(s => s.status !== 'inactive')
            })
        } catch (error) {
            console.error("Error toggling staff visibility:", error)
            throw error
        }
    }
}))
