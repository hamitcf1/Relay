import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar } from 'lucide-react'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ShiftType } from '@/types'

interface CurrentShiftDisplayProps {
    hotelId: string
    userId: string
}

interface WeekShift {
    day: string
    date: string
    shift: ShiftType | 'OFF' | null
    isToday: boolean
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHIFT_INFO: Record<string, { label: string; time: string; color: string }> = {
    'A': { label: 'Morning', time: '07:00 - 15:00', color: 'bg-indigo-500 text-white' },
    'B': { label: 'Afternoon', time: '15:00 - 23:00', color: 'bg-purple-500 text-white' },
    'C': { label: 'Night', time: '23:00 - 07:00', color: 'bg-rose-500 text-white' },
    'E': { label: 'Extra', time: 'Varies', color: 'bg-amber-500 text-white' },
    'OFF': { label: 'Off', time: '-', color: 'bg-zinc-700 text-zinc-400' },
}

export function CurrentShiftDisplay({ hotelId, userId }: CurrentShiftDisplayProps) {
    const [weekShifts, setWeekShifts] = useState<WeekShift[]>([])
    const [loading, setLoading] = useState(true)

    // Get current week dates
    const getWeekDates = () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(now.setDate(diff))

        const dates: { day: string; date: string }[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            dates.push({
                day: DAYS[i],
                date: d.toISOString().split('T')[0],
            })
        }
        return dates
    }

    const weekStart = useMemo(() => {
        const dates = getWeekDates()
        return dates[0].date
    }, [])

    const todayStr = new Date().toISOString().split('T')[0]

    // Fetch user's schedule for the week
    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true)
            try {
                const rosterRef = collection(db, 'hotels', hotelId, 'roster')
                const rosterDoc = await getDocs(query(rosterRef, where('week_start', '==', weekStart), limit(1)))

                const weekDates = getWeekDates()
                let schedule: Record<string, ShiftType | 'OFF' | null> = {}

                if (!rosterDoc.empty) {
                    const data = rosterDoc.docs[0].data()
                    schedule = data.schedule?.[userId] || {}
                }

                const shifts: WeekShift[] = weekDates.map((d) => ({
                    day: d.day,
                    date: d.date,
                    shift: schedule[d.day] || null,
                    isToday: d.date === todayStr,
                }))

                setWeekShifts(shifts)
            } catch (error) {
                console.error('Error fetching schedule:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSchedule()
    }, [hotelId, userId, weekStart, todayStr])

    const todayShift = weekShifts.find((s) => s.isToday)

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    My Weekly Schedule
                </CardTitle>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-8 bg-zinc-800 rounded" />
                        <div className="h-12 bg-zinc-800 rounded" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Today's Shift Highlight */}
                        {todayShift && todayShift.shift && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'p-4 rounded-lg',
                                    todayShift.shift !== 'OFF'
                                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                                        : 'bg-zinc-800/50'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-1">Today's Shift</p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-2xl font-bold px-3 py-1 rounded',
                                                SHIFT_INFO[todayShift.shift].color
                                            )}>
                                                {todayShift.shift}
                                            </span>
                                            <div>
                                                <p className="font-medium text-zinc-200">{SHIFT_INFO[todayShift.shift].label}</p>
                                                <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {SHIFT_INFO[todayShift.shift].time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {todayShift.shift !== 'OFF' && (
                                        <Badge variant="success" className="animate-pulse">
                                            Active
                                        </Badge>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Week Overview */}
                        <div className="flex gap-1 overflow-x-auto pb-2">
                            {weekShifts.map((ws) => (
                                <motion.div
                                    key={ws.day}
                                    className={cn(
                                        'flex-1 min-w-[48px] p-2 rounded-lg text-center transition-all',
                                        ws.isToday
                                            ? 'ring-2 ring-indigo-500 bg-indigo-500/10'
                                            : 'bg-zinc-800/30'
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <p className={cn(
                                        'text-xs mb-1',
                                        ws.isToday ? 'text-indigo-300 font-bold' : 'text-zinc-500'
                                    )}>
                                        {ws.day}
                                    </p>
                                    <div className={cn(
                                        'text-sm font-bold py-1 rounded',
                                        ws.shift ? SHIFT_INFO[ws.shift].color : 'text-zinc-600'
                                    )}>
                                        {ws.shift || '—'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                            {Object.entries(SHIFT_INFO).map(([key, info]) => (
                                <div key={key} className="flex items-center gap-1">
                                    <span className={cn('w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold', info.color)}>
                                        {key}
                                    </span>
                                    <span className="text-xs text-zinc-500">{info.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
