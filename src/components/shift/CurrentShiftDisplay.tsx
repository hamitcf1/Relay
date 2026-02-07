import { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, RefreshCcw, Briefcase } from 'lucide-react'
import { CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRosterStore } from '@/stores/rosterStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useLanguageStore } from '@/stores/languageStore'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { getDateLocale } from '@/lib/utils'
import type { ShiftType } from '@/types'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'

interface CurrentShiftDisplayProps {
    hotelId: string
    userId: string
}

export function CurrentShiftDisplay({ hotelId, userId }: CurrentShiftDisplayProps) {
    const { schedule, subscribeToRoster } = useRosterStore()
    const { currentShift } = useShiftStore()
    const { t } = useLanguageStore()
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Move SHIFT_INFO inside to use t() for localized labels
    const SHIFT_INFO: Record<string, { label: string; time: string; color: string }> = {
        'A': { label: t('shift.morning'), time: '08:00 - 16:00', color: 'bg-indigo-500/10 text-indigo-400 dark:text-indigo-300 border-indigo-500/20' },
        'B': { label: t('shift.afternoon'), time: '16:00 - 00:00', color: 'bg-purple-500/10 text-purple-400 dark:text-purple-300 border-purple-500/20' },
        'C': { label: t('shift.night'), time: '00:00 - 08:00', color: 'bg-rose-500/10 text-rose-400 dark:text-rose-300 border-rose-500/20' },
        'E': { label: t('shift.extra'), time: '10:00 - 18:00', color: 'bg-amber-500/10 text-amber-400 dark:text-amber-300 border-amber-500/20' },
        'OFF': { label: t('shift.off'), time: '-', color: 'bg-muted text-muted-foreground dark:text-zinc-300 border-border' },
    }

    // Ensure we are subscribed
    useEffect(() => {
        if (!hotelId) return
        const unsub = subscribeToRoster(hotelId)
        return () => unsub()
    }, [hotelId])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        subscribeToRoster(hotelId)
        setTimeout(() => setIsRefreshing(false), 800)
    }

    // Calculate this week's shifts locally from user store
    const userWeekShifts = useMemo(() => {
        const today = new Date()
        const start = startOfWeek(today, { weekStartsOn: 1 }) // Monday start
        const shifts = []

        const userSchedule = schedule[userId] || {}

        for (let i = 0; i < 7; i++) {
            const date = addDays(start, i)
            const dateKey = format(date, 'yyyy-MM-dd')
            const shiftCode = userSchedule[dateKey] as ShiftType | 'OFF' || null

            shifts.push({
                date,
                dayName: format(date, 'EEE', { locale: getDateLocale() }),
                shift: shiftCode,
                isToday: isSameDay(date, today)
            })
        }
        return shifts
    }, [schedule, userId])

    const todayShift = userWeekShifts.find(s => s.isToday)
    const activeShiftType = currentShift?.type

    // Determine active shift label
    const activeLabel = activeShiftType ? SHIFT_INFO[activeShiftType]?.label : t('shift.none')

    return (
        <CollapsibleCard
            id="current-shift"
            title={
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-zinc-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    {t('dashboard.weeklySchedule')}
                </CardTitle>
            }
            headerActions={
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6 text-muted-foreground", isRefreshing && "animate-spin")}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleRefresh()
                    }}
                >
                    <RefreshCcw className="w-3.5 h-3.5" />
                </Button>
            }
            className="bg-card border-border"
        >
            <div className="space-y-5 pt-2">
                {/* Active Hotel Status Context */}
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-md">
                            <Briefcase className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('dashboard.activeHotelShift')}</p>
                            <p className="text-sm font-medium text-foreground">{activeLabel}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-card text-muted-foreground border-border">
                        {currentShift ? t('status.ongoing') : t('status.noActiveShift')}
                    </Badge>
                </div>

                {/* Today's Shift Highlight */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('dashboard.todaysAssignment')}</span>
                        {todayShift && todayShift.shift && (
                            <Badge className={cn("text-[10px] px-2 py-0.5", SHIFT_INFO[todayShift.shift]?.color || "bg-muted")}>
                                {SHIFT_INFO[todayShift.shift]?.time}
                            </Badge>
                        )}
                    </div>

                    {todayShift?.shift ? (
                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            SHIFT_INFO[todayShift.shift]?.color || "bg-muted border-border"
                        )}>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 opacity-80" />
                                <div>
                                    <p className="text-sm font-bold">{SHIFT_INFO[todayShift.shift]?.label}</p>
                                    <p className="text-xs opacity-70">{t('dashboard.assignedShift')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-lg border border-dashed border-border bg-card/50 text-center">
                            <span className="text-xs text-muted-foreground">{t('dashboard.noAssignedShift')}</span>
                        </div>
                    )}
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {userWeekShifts.map((day) => (
                        <div
                            key={day.dayName}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                                day.isToday ? "bg-muted border-border ring-1 ring-primary/20" : "bg-transparent border-transparent hover:bg-muted/50"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] font-medium uppercase",
                                day.isToday ? "text-primary" : "text-muted-foreground"
                            )}>
                                {day.dayName}
                            </span>

                            {day.shift ? (
                                <div className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                                    SHIFT_INFO[day.shift]?.color.split(' ')[0], // Use just the bg color
                                    SHIFT_INFO[day.shift]?.color.includes('text-white') ? 'text-white' : 'text-foreground'
                                )}>
                                    {day.shift === 'OFF' ? '-' : day.shift}
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground">
                                    -
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </CollapsibleCard>
    )
}


