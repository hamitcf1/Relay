import { useState, useEffect, useMemo } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Loader2, GripVertical, Eye, EyeOff, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import {
    doc,
    getDoc,
    setDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { syncRosterToCalendar } from '@/lib/calendar-sync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { cn, formatDisplayDate } from '@/lib/utils'
import type { ShiftType } from '@/types'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'
import { useRosterStore } from '@/stores/rosterStore'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'

interface RosterMatrixProps {
    hotelId: string
    canEdit: boolean
}

interface StaffMember {
    uid: string
    name: string
    is_hidden_in_roster?: boolean
}

type ShiftValue = ShiftType | 'OFF' | null

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Default shifts if none configured in hotel settings
const DEFAULT_SHIFT_COLORS: Record<string, string> = {
    'A': 'bg-primary/80 text-primary-foreground',
    'B': 'bg-amber-700/80 text-white',
    'C': 'bg-rose-500/80 text-white',
    'E': 'bg-amber-500/80 text-white',
    'OFF': 'bg-muted text-muted-foreground border border-border/50',
}

const DEFAULT_SHIFT_CYCLE: (ShiftType | 'OFF')[] = ['A', 'B', 'C', 'E', 'OFF']

export function RosterMatrix({ hotelId, canEdit }: RosterMatrixProps) {
    const { t } = useLanguageStore()
    const { hotel, updateHotelSettings } = useHotelStore()
    const { user } = useAuthStore()
    const { toggleStaffVisibility } = useRosterStore()
    const { activeStaff: storeStaff } = useRosterStore()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftValue>>>({})
    const [weekOffset, setWeekOffset] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)

    const isGM = user?.role === 'gm'

    const handleExportPuantaj = async () => {
        if (!staff.length) {
            toast.error(t('roster.exportEmpty'))
            return
        }
        setExporting(true)
        try {
            const { generatePuantaj } = await import('@/lib/puantaj')
            const now = new Date()
            // Use the full date-keyed schedule from the store (covers entire
            // month). The local `schedule` here is only the current week and
            // keyed by short day names ('Mon', 'Tue', ...).
            const fullSchedule = useRosterStore.getState().schedule
            await generatePuantaj({
                staff,
                schedule: fullSchedule,
                year: now.getFullYear(),
                month: now.getMonth(),
                today: now,
            })
            toast.success(t('roster.exportSuccess'))
        } catch (err) {
            console.error('Puantaj export failed:', err)
            toast.error(t('roster.exportError'))
        } finally {
            setExporting(false)
        }
    }

    // Sync store staff to local staff for reordering
    useEffect(() => {
        if (storeStaff.length > 0) {
            setStaff(storeStaff)
        }
    }, [storeStaff])

    // Dynamic shifts from hotel settings
    const shifts = useMemo(() => {
        if (hotel?.settings?.shifts && hotel.settings.shifts.length > 0) {
            const dynamic = hotel.settings.shifts.map((s: any) => s.code as ShiftType | 'OFF')
            if (!dynamic.includes('OFF')) dynamic.push('OFF')
            return dynamic
        }
        return DEFAULT_SHIFT_CYCLE
    }, [hotel?.settings?.shifts])

    const shiftColors = useMemo(() => {
        if (hotel?.settings?.shifts && hotel.settings.shifts.length > 0) {
            const colors: Record<string, string> = { ...DEFAULT_SHIFT_COLORS }
            hotel.settings.shifts.forEach((s: any) => {
                if (s.code) colors[s.code] = `${s.color || 'bg-primary'} text-white`
            })
            return colors
        }
        return DEFAULT_SHIFT_COLORS
    }, [hotel?.settings?.shifts])

    // Get week start date (Monday)
    const getWeekStart = (offset: number = 0): string => {
        const now = new Date()
        const dayOfWeek = now.getDay() // 0 (Sun) - 6 (Sat)
        // Calculate difference to get to Monday (1)
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offset * 7)

        const monday = new Date(now) // Clone to avoid mutation
        monday.setDate(diff)
        monday.setHours(0, 0, 0, 0)

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
        const today = new Date()
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            const isToday = date.toDateString() === today.toDateString()
            const dayStr = String(date.getDate()).padStart(2, '0')
            const monthStr = String(date.getMonth() + 1).padStart(2, '0')
            return {
                day: DAYS[i],
                dateStr: `${dayStr}/${monthStr}`,
                isToday
            }
        })
    }, [weekStart])

    // Sorted staff based on hotel settings AND visibility
    const sortedStaff = useMemo(() => {
        let currentStaff = [...staff]

        // Filter out hidden staff for non-GMs
        if (user?.role !== 'gm') {
            currentStaff = currentStaff.filter(s => !s.is_hidden_in_roster)
        }

        if (!hotel?.settings?.staff_order || currentStaff.length === 0) return currentStaff;

        const order = hotel.settings.staff_order;
        return currentStaff.sort((a, b) => {
            const indexA = order.indexOf(a.uid);
            const indexB = order.indexOf(b.uid);

            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
        });
    }, [staff, hotel?.settings?.staff_order, user?.role]);

    const handleReorder = async (newOrder: StaffMember[]) => {
        setStaff(newOrder);
        if (canEdit && hotelId) {
            try {
                await updateHotelSettings(hotelId, { staff_order: newOrder.map(s => s.uid) });
            } catch (error) {
                console.error('Failed to save staff order:', error);
            }
        }
    };

    // Fetch schedule (staff is now handled by store)
    useEffect(() => {
        if (!hotelId) return

        const fetchData = async () => {
            setLoading(true)

            try {
                // Fetch roster for this week
                const rosterRef = doc(db, 'hotels', hotelId, 'roster', weekStart)
                const rosterSnap = await getDoc(rosterRef)

                if (rosterSnap.exists()) {
                    setSchedule(rosterSnap.data().schedule || {})
                } else {
                    // Initialize empty schedule
                    const emptySchedule: Record<string, Record<string, ShiftValue>> = {}
                    staff.forEach((s) => {
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
    }, [hotelId, weekStart, staff.length === 0]) // Re-run if staff list was initially empty

    // Cycle shift value
    const cycleShift = async (userId: string, day: string, direction: 'forward' | 'backward' = 'forward') => {
        if (!canEdit) return

        const currentValue = schedule[userId]?.[day] || null
        const currentIndex = currentValue ? shifts.indexOf(currentValue as ShiftType | 'OFF') : -1

        let nextIndex: number
        if (direction === 'forward') {
            nextIndex = (currentIndex + 1) % shifts.length
        } else {
            nextIndex = (currentIndex - 1 + shifts.length) % shifts.length
        }

        const nextValue = shifts[nextIndex]

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
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <CollapsibleCard
            id="roster-matrix"
            title={
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t('roster.title')}
                    {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </CardTitle>
            }
            headerActions={
                <div className="flex items-center gap-2">
                    {isGM && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleExportPuantaj()
                            }}
                            disabled={exporting}
                            title={t('roster.exportPuantaj')}
                        >
                            {exporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span className="hidden sm:inline text-xs">{t('roster.exportPuantaj')}</span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation()
                            setWeekOffset((prev) => prev - 1)
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {weekOffset === 0 ? (
                        <span className="text-xs text-primary font-semibold min-w-[100px] text-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            {t('roster.currentWeek') || 'This Week'}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground min-w-[100px] text-center font-mono">
                            {formatDisplayDate(weekStart)}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation()
                            setWeekOffset((prev) => prev + 1)
                        }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            }
        >
            <div className="overflow-x-auto pt-2">
                {staff.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                        {t('roster.noStaff')}
                    </p>
                ) : (
                    <table className="w-full text-sm table-fixed">
                        <thead>
                            <tr className="border-b border-border">
                                {canEdit && <th className="w-5 sm:w-8"></th>}
                                <th className="text-left py-2 px-1 sm:px-2 text-muted-foreground font-medium text-[10px] sm:text-xs uppercase tracking-wider w-[70px] sm:w-[120px]">{t('common.staff')}</th>
                                {weekDates.map(({ day, dateStr, isToday }) => {
                                    const dayKey = `day.${day.toLowerCase()}` as any
                                    return (
                                        <th key={day} className={cn(
                                            "text-center py-2 px-0.5 font-medium",
                                            isToday ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            <div className={cn(
                                                "text-[9px] sm:text-xs mb-0.5 font-mono",
                                                isToday ? "opacity-100" : "opacity-50"
                                            )}>{dateStr}</div>
                                            <div className={cn(
                                                "text-[7px] sm:text-[8px] md:text-[9px] truncate leading-tight uppercase",
                                                isToday && "font-semibold"
                                            )}>{t(dayKey)}</div>
                                            {isToday && <div className="h-0.5 w-3 sm:w-4 mx-auto mt-0.5 rounded-full bg-primary" />}
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
                            {sortedStaff.map((member) => {
                                const isCurrentUser = user?.uid === member.uid
                                return (
                                    <Reorder.Item
                                        key={member.uid}
                                        value={member}
                                        as="tr"
                                        className={cn(
                                            "border-b border-border/50",
                                            isCurrentUser
                                                ? "bg-primary/5 border-l-2 border-l-primary"
                                                : "bg-background/50"
                                        )}
                                    >
                                        {canEdit && (
                                            <td className="py-1 sm:py-2 px-0.5 sm:px-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 hover:opacity-100 transition-opacity" />
                                            </td>
                                        )}
                                        <td className="py-2 px-1 sm:px-2 text-foreground text-xs sm:text-sm">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <span className={cn("truncate min-w-0 flex-1", member.is_hidden_in_roster && "opacity-50 line-through decoration-muted-foreground")}>
                                                    {member.name}
                                                </span>
                                                {user?.role === 'gm' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (hotelId) {
                                                                toggleStaffVisibility(hotelId, member.uid, !member.is_hidden_in_roster)
                                                                    .then(() => {
                                                                        // Update local state to reflect change immediately
                                                                        setStaff(prev => prev.map(s => s.uid === member.uid ? { ...s, is_hidden_in_roster: !member.is_hidden_in_roster } : s))
                                                                    })
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                                        title={member.is_hidden_in_roster ? t('roster.show') : t('roster.hide')}
                                                    >
                                                        {member.is_hidden_in_roster ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        {DAYS.map((day, dayIdx) => {
                                            const shift = schedule[member.uid]?.[day]
                                            const isToday = weekDates[dayIdx]?.isToday
                                            return (
                                                <td key={day} className={cn(
                                                    "py-1 sm:py-2 px-0.5 sm:px-1 text-center align-middle relative",
                                                    isToday && "bg-primary/5 rounded-md"
                                                )}>
                                                    <motion.button
                                                        onClick={() => cycleShift(member.uid, day, 'forward')}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            cycleShift(member.uid, day, 'backward');
                                                        }}
                                                        disabled={!canEdit}
                                                        className={cn(
                                                            'w-full max-w-[36px] sm:max-w-[48px] h-7 sm:h-9 mx-auto rounded text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center',
                                                            shift ? shiftColors[shift] : 'bg-muted/30 text-muted-foreground/50',
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
                                )
                            })}
                        </Reorder.Group>
                    </table>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    {shifts.map((shift) => {
                        const shiftInfo = hotel?.settings?.shifts?.find((s: any) => s.code === shift)
                        return (
                            <div key={shift} className="flex items-center gap-1.5">
                                <div className={cn('w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold', shiftColors[shift])}>
                                    {shift}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {shiftInfo ? shiftInfo.name : (
                                        <>
                                            {shift === 'A' && t('shift.morning')}
                                            {shift === 'B' && t('shift.afternoon')}
                                            {shift === 'C' && t('shift.night')}
                                            {shift === 'E' && t('shift.extra')}
                                            {shift === 'OFF' && t('shift.off')}
                                        </>
                                    )}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </CollapsibleCard>
    )
}
