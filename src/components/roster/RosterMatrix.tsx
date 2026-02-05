import { useState, useEffect, useMemo } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Loader2, GripVertical } from 'lucide-react'
import {
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { syncRosterToCalendar } from '@/lib/calendar-sync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ShiftType } from '@/types'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'

interface RosterMatrixProps {
    hotelId: string
    canEdit: boolean
}

interface StaffMember {
    uid: string
    name: string
}

type ShiftValue = ShiftType | 'OFF' | null

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHIFT_COLORS: Record<ShiftValue & string, string> = {
    'A': 'bg-indigo-500/80 text-white',
    'B': 'bg-purple-500/80 text-white',
    'C': 'bg-rose-500/80 text-white',
    'E': 'bg-amber-500/80 text-white',
    'OFF': 'bg-zinc-700 text-zinc-400',
}

const SHIFT_CYCLE: (ShiftType | 'OFF')[] = ['A', 'B', 'C', 'E', 'OFF']

export function RosterMatrix({ hotelId, canEdit }: RosterMatrixProps) {
    const { t } = useLanguageStore()
    const { hotel, updateStaffOrder } = useHotelStore()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftValue>>>({})
    const [weekOffset, setWeekOffset] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Get week start date (Monday)
    const getWeekStart = (offset: number = 0): string => {
        const now = new Date()
        const dayOfWeek = now.getDay() // 0 (Sun) - 6 (Sat)
        // Calculate difference to get to Monday (1)
        // If Sunday (0), we need to subtract 6 days. If Monday (1), subtract 0. If Tuesday (2), subtract 1.
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offset * 7)

        const monday = new Date(now.setDate(diff))

        // Return YYYY-MM-DD in local time
        const year = monday.getFullYear()
        const month = String(monday.getMonth() + 1).padStart(2, '0')
        const day = String(monday.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const weekStart = getWeekStart(weekOffset)

    // Calculate dates for the header
    const weekDates = useMemo(() => {
        const start = new Date(weekStart)
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            return {
                day: DAYS[i],
                dateStr: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}` // DD/MM
            }
        })
    }, [weekStart])

    // Sorted staff based on hotel settings
    const sortedStaff = useMemo(() => {
        if (!hotel?.settings?.staff_order || staff.length === 0) return staff;

        const order = hotel.settings.staff_order;
        const sorted = [...staff].sort((a, b) => {
            const indexA = order.indexOf(a.uid);
            const indexB = order.indexOf(b.uid);

            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
        });

        return sorted;
    }, [staff, hotel?.settings?.staff_order]);

    const handleReorder = async (newOrder: StaffMember[]) => {
        setStaff(newOrder);
        if (canEdit && hotelId) {
            try {
                await updateStaffOrder(hotelId, newOrder.map(s => s.uid));
            } catch (error) {
                console.error('Failed to save staff order:', error);
            }
        }
    };

    // Fetch staff and schedule
    useEffect(() => {
        if (!hotelId) return

        const fetchData = async () => {
            setLoading(true)

            try {
                // Fetch staff members for this hotel
                const usersSnap = await getDocs(
                    query(collection(db, 'users'), where('hotel_id', '==', hotelId))
                )

                const staffList: StaffMember[] = []
                usersSnap.forEach((doc) => {
                    const data = doc.data()
                    if (data.name && data.name !== 'Unknown') {
                        staffList.push({
                            uid: doc.id,
                            name: data.name,
                        })
                    }
                })
                setStaff(staffList)

                // Fetch roster for this week
                const rosterRef = doc(db, 'hotels', hotelId, 'roster', weekStart)
                const rosterSnap = await getDoc(rosterRef)

                if (rosterSnap.exists()) {
                    setSchedule(rosterSnap.data().schedule || {})
                } else {
                    // Initialize empty schedule
                    const emptySchedule: Record<string, Record<string, ShiftValue>> = {}
                    staffList.forEach((s) => {
                        emptySchedule[s.uid] = {}
                        DAYS.forEach((day) => {
                            emptySchedule[s.uid][day] = null
                        })
                    })
                    setSchedule(emptySchedule)
                }
            } catch (error) {
                console.error('Error fetching roster:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [hotelId, weekStart])

    // Cycle shift value
    const cycleShift = async (userId: string, day: string) => {
        if (!canEdit) return

        const currentValue = schedule[userId]?.[day] || null
        const currentIndex = currentValue ? SHIFT_CYCLE.indexOf(currentValue as ShiftType | 'OFF') : -1
        const nextValue = SHIFT_CYCLE[(currentIndex + 1) % SHIFT_CYCLE.length]

        // Update local state
        setSchedule((prev) => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [day]: nextValue,
            },
        }))

        // Save to Firestore
        setSaving(true)
        try {
            const rosterRef = doc(db, 'hotels', hotelId, 'roster', weekStart)
            await setDoc(rosterRef, {
                week_start: weekStart,
                schedule: {
                    ...schedule,
                    [userId]: {
                        ...schedule[userId],
                        [day]: nextValue,
                    },
                },
                updated_at: new Date(),
            }, { merge: true })

            // Sync to Calendar
            const dayIndex = DAYS.indexOf(day)
            if (dayIndex !== -1) {
                const start = new Date(weekStart)
                const targetDate = new Date(start)
                targetDate.setDate(start.getDate() + dayIndex)

                const year = targetDate.getFullYear()
                const month = String(targetDate.getMonth() + 1).padStart(2, '0')
                const dateDay = String(targetDate.getDate()).padStart(2, '0')
                const dateStr = `${year}-${month}-${dateDay}`

                const user = staff.find(s => s.uid === userId)
                if (user) {
                    await syncRosterToCalendar(hotelId, userId, user.name, dateStr, nextValue)
                }
            }
        } catch (error) {
            console.error('Error saving roster:', error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    {t('roster.title')}
                    {saving && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                </CardTitle>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setWeekOffset((prev) => prev - 1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-zinc-400 min-w-[80px] text-center">
                        {weekStart}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
                {staff.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">
                        {t('roster.noStaff')}
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                {canEdit && <th className="w-8"></th>}
                                <th className="text-left py-2 px-2 text-zinc-400 font-medium">{t('common.staff')}</th>
                                {weekDates.map(({ day, dateStr }) => {
                                    const dayKey = `day.${day.toLowerCase()}` as any
                                    return (
                                        <th key={day} className="text-center py-2 px-1 text-zinc-400 font-medium w-12">
                                            <div className="text-[10px] opacity-50 mb-0.5 font-mono">{dateStr}</div>
                                            <div>{t(dayKey)}</div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <Reorder.Group
                            as="tbody"
                            axis="y"
                            values={sortedStaff}
                            onReorder={handleReorder}
                        >
                            {sortedStaff.map((member) => (
                                <Reorder.Item
                                    key={member.uid}
                                    value={member}
                                    as="tr"
                                    className="border-b border-zinc-800/50 bg-zinc-950/50"
                                >
                                    {canEdit && (
                                        <td className="py-2 px-1 text-zinc-600 cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" />
                                        </td>
                                    )}
                                    <td className="py-2 px-2 text-zinc-300 whitespace-nowrap">
                                        {member.name}
                                    </td>
                                    {DAYS.map((day) => {
                                        const shift = schedule[member.uid]?.[day]
                                        return (
                                            <td key={day} className="py-2 px-1 text-center">
                                                <motion.button
                                                    onClick={() => cycleShift(member.uid, day)}
                                                    disabled={!canEdit}
                                                    className={cn(
                                                        'w-10 h-8 rounded-md text-xs font-bold transition-all',
                                                        shift ? SHIFT_COLORS[shift] : 'bg-zinc-800/50 text-zinc-600',
                                                        canEdit && 'hover:opacity-80 cursor-pointer',
                                                        !canEdit && 'cursor-default'
                                                    )}
                                                    whileTap={canEdit ? { scale: 0.9 } : undefined}
                                                >
                                                    {shift || '—'}
                                                </motion.button>
                                            </td>
                                        )
                                    })}
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </table>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                    {SHIFT_CYCLE.map((shift) => (
                        <div key={shift} className="flex items-center gap-1.5">
                            <div className={cn('w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold', SHIFT_COLORS[shift])}>
                                {shift}
                            </div>
                            <span className="text-xs text-zinc-500">
                                {shift === 'A' && t('shift.morning')}
                                {shift === 'B' && t('shift.afternoon')}
                                {shift === 'C' && t('shift.night')}
                                {shift === 'E' && t('shift.extra')}
                                {shift === 'OFF' && t('shift.off')}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
