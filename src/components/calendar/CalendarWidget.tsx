import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCalendarStore, eventTypeInfo, type CalendarEventType } from '@/stores/calendarStore'
import { useAuthStore } from '@/stores/authStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useLanguageStore } from '@/stores/languageStore'

interface CalendarWidgetProps {
    hotelId: string
}

export function CalendarWidget({ hotelId }: CalendarWidgetProps) {
    const { events, subscribeToEvents, addEvent, toggleComplete, deleteEvent } = useCalendarStore()
    const { subscribeToRoster, getShiftsForDate } = useRosterStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()

    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [newEventType, setNewEventType] = useState<CalendarEventType>('reminder')
    const [newEventTitle, setNewEventTitle] = useState('')
    const [newEventTime, setNewEventTime] = useState('')
    const [newEventRoom, setNewEventRoom] = useState('')

    // Subscribe to events for current month view
    useEffect(() => {
        if (!hotelId) return

        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

        const unsubEvents = subscribeToEvents(hotelId, start, end)
        const unsubRoster = subscribeToRoster(hotelId)

        return () => {
            unsubEvents()
            unsubRoster()
        }
    }, [hotelId, currentMonth, subscribeToEvents, subscribeToRoster])

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        return events.filter(event => isSameDay(event.date, date))
    }

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

        const days: Date[] = []
        let day = startDate

        while (day <= endDate) {
            days.push(day)
            day = addDays(day, 1)
        }

        return days
    }, [currentMonth])

    // Selected date events
    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

    const handleAddEvent = async () => {
        if (!newEventTitle.trim() || !selectedDate || !user) return

        await addEvent(hotelId, {
            type: newEventType,
            title: newEventTitle.trim(),
            description: null,
            date: selectedDate,
            time: newEventTime || null,
            room_number: newEventRoom || null,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown',
        })

        // Reset form
        setNewEventTitle('')
        setNewEventTime('')
        setNewEventRoom('')
        setIsAdding(false)
    }

    const handleToggleComplete = async (eventId: string, isCompleted: boolean) => {
        await toggleComplete(hotelId, eventId, !isCompleted)
    }

    const handleDeleteEvent = async (eventId: string) => {
        if (confirm('Delete this event?')) {
            await deleteEvent(hotelId, eventId)
        }
    }

    return (
        <Card className="glass border-zinc-800/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        {t('module.calendar')}
                    </CardTitle>

                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-zinc-400 min-w-[80px] text-center">
                            {format(currentMonth, 'MMM yyyy')}
                        </span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-zinc-500 font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                        const dayEvents = getEventsForDate(day)
                        const isSelected = selectedDate && isSameDay(day, selectedDate)
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isTodayDate = isToday(day)

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    'aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all relative',
                                    isSelected
                                        ? 'bg-indigo-500 text-white'
                                        : isTodayDate
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                                            : isCurrentMonth
                                                ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                                                : 'bg-transparent text-zinc-600 hover:bg-zinc-800/30'
                                )}
                            >
                                <span>{format(day, 'd')}</span>
                                {/* Event dots */}
                                {dayEvents.length > 0 && (
                                    <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                                        {dayEvents.slice(0, 3).map((event, ei) => (
                                            <span
                                                key={ei}
                                                className={cn(
                                                    'w-1 h-1 rounded-full',
                                                    eventTypeInfo[event.type]?.color || 'bg-zinc-500'
                                                )}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[8px] text-zinc-400">+</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Selected Date Details */}
                <AnimatePresence>
                    {selectedDate && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 border-t border-zinc-800 space-y-3">
                                {/* Roster for Selected Date */}
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-zinc-500">{t('module.roster')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getShiftsForDate(selectedDate).length > 0 ? (
                                            getShiftsForDate(selectedDate).map((shift) => (
                                                <Badge
                                                    key={shift.uid}
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0 bg-zinc-800/50 border-zinc-700 text-zinc-300"
                                                >
                                                    {shift.name} <span className="text-indigo-400 ml-1 font-bold">{shift.shift}</span>
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-zinc-600 italic">No shifts scheduled</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">
                                            {format(selectedDate, 'EEEE, MMM d')}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-xs hover:bg-indigo-500/10 hover:text-indigo-400"
                                            onClick={() => setIsAdding(!isAdding)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>

                                    {/* Add Event Form */}
                                    <AnimatePresence>
                                        {isAdding && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-2 p-2 bg-zinc-900/50 rounded-lg border border-zinc-700"
                                            >
                                                {/* Event Type Pills */}
                                                <div className="flex flex-wrap gap-1">
                                                    {(Object.keys(eventTypeInfo) as CalendarEventType[]).map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setNewEventType(type)}
                                                            className={cn(
                                                                'text-[10px] px-2 py-0.5 rounded-full',
                                                                newEventType === type
                                                                    ? `${eventTypeInfo[type].color} text-white`
                                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                            )}
                                                        >
                                                            {eventTypeInfo[type].icon} {eventTypeInfo[type].label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <Input
                                                    placeholder="Event title..."
                                                    value={newEventTitle}
                                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                                    className="h-8 text-xs"
                                                />

                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Time (optional)"
                                                        value={newEventTime}
                                                        onChange={(e) => setNewEventTime(e.target.value)}
                                                        className="h-7 text-xs flex-1"
                                                        type="time"
                                                    />
                                                    <Input
                                                        placeholder="Room #"
                                                        value={newEventRoom}
                                                        onChange={(e) => setNewEventRoom(e.target.value)}
                                                        className="h-7 text-xs w-20"
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 h-7 text-xs"
                                                        onClick={handleAddEvent}
                                                        disabled={!newEventTitle.trim()}
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                        onClick={() => setIsAdding(false)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Events List */}
                                    {selectedDateEvents.length === 0 && !isAdding ? (
                                        <p className="text-xs text-zinc-500 text-center py-2">No events</p>
                                    ) : (
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                                            {selectedDateEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        'flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50',
                                                        event.is_completed && 'opacity-50'
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => handleToggleComplete(event.id, event.is_completed)}
                                                        className={cn(
                                                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                                                            event.is_completed
                                                                ? 'bg-emerald-500 border-emerald-500'
                                                                : 'border-zinc-600 hover:border-zinc-400'
                                                        )}
                                                    >
                                                        {event.is_completed && <Check className="w-3 h-3 text-white" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn('text-[9px] px-1.5', eventTypeInfo[event.type]?.color)}
                                                            >
                                                                {eventTypeInfo[event.type]?.icon}
                                                            </Badge>
                                                            <span className={cn(
                                                                'text-xs text-zinc-200 truncate',
                                                                event.is_completed && 'line-through'
                                                            )}>
                                                                {event.title}
                                                            </span>
                                                        </div>
                                                        {(event.time || event.room_number) && (
                                                            <div className="text-[10px] text-zinc-500 mt-0.5">
                                                                {event.time && <span>{event.time}</span>}
                                                                {event.time && event.room_number && <span> • </span>}
                                                                {event.room_number && <span>Room {event.room_number}</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="text-zinc-500 hover:text-rose-400 p-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
