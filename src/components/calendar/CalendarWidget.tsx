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
import { getDateLocale } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CardTitle } from '@/components/ui/card'
import { cn, formatDisplayDate } from '@/lib/utils'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'
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
    const [newEventTotalPrice, setNewEventTotalPrice] = useState<string>('')
    const [newEventCollected, setNewEventCollected] = useState<string>('0')
    const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null)
    const [tempCollected, setTempCollected] = useState<string>('')

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
            total_price: newEventTotalPrice ? parseFloat(newEventTotalPrice) : null,
            collected_amount: newEventCollected ? parseFloat(newEventCollected) : null,
            created_by: user.uid,
            created_by_name: user.name || 'Unknown',
        })

        // Reset form
        setNewEventTitle('')
        setNewEventTime('')
        setNewEventRoom('')
        setNewEventTotalPrice('')
        setNewEventCollected('0')
        setIsAdding(false)
    }

    const handleUpdatePayment = async (eventId: string) => {
        if (!tempCollected || isNaN(parseFloat(tempCollected))) return

        const newCollected = parseFloat(tempCollected)
        await useCalendarStore.getState().updateEvent(hotelId, eventId, {
            collected_amount: newCollected
        })
        setUpdatingPaymentId(null)
    }

    const handleToggleComplete = async (eventId: string, isCompleted: boolean) => {
        await toggleComplete(hotelId, eventId, !isCompleted)
    }

    const handleDeleteEvent = async (eventId: string) => {
        if (confirm(t('common.deleteConfirm'))) {
            await deleteEvent(hotelId, eventId)
        }
    }

    return (
        <CollapsibleCard
            id="calendar-widget"
            title={
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    {t('module.calendar')}
                </CardTitle>
            }
            headerActions={
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation()
                            setCurrentMonth(subMonths(currentMonth, 1))
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground min-w-[70px] text-center font-mono">
                        {format(currentMonth, 'MMM yyyy', { locale: getDateLocale() })}
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation()
                            setCurrentMonth(addMonths(currentMonth, 1))
                        }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            }
            className="glass border-border/50"
        >
            <div className="space-y-3 pt-2">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1">
                    {[
                        t('day.short.mon'),
                        t('day.short.tue'),
                        t('day.short.wed'),
                        t('day.short.thu'),
                        t('day.short.fri'),
                        t('day.short.sat'),
                        t('day.short.sun')
                    ].map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">
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
                                        ? 'bg-primary text-primary-foreground'
                                        : isTodayDate
                                            ? 'bg-primary/20 text-primary border border-primary/50'
                                            : isCurrentMonth
                                                ? 'bg-muted/50 text-foreground hover:bg-muted'
                                                : 'bg-transparent text-muted-foreground/50 hover:bg-muted/30'
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
                                            <span className="text-[8px] text-muted-foreground">+</span>
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
                            <div className="pt-3 border-t border-border space-y-3">
                                {/* Roster for Selected Date */}
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground">{t('module.roster')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getShiftsForDate(selectedDate).length > 0 ? (
                                            getShiftsForDate(selectedDate).map((shift) => (
                                                <Badge
                                                    key={shift.uid}
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0 bg-muted/50 border-border text-foreground"
                                                >
                                                    {shift.name} <span className="text-primary ml-1 font-bold">{shift.shift}</span>
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-zinc-600 italic">{t('calendar.noShifts')}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">
                                            {format(selectedDate, 'EEEE', { locale: getDateLocale() })}, {formatDisplayDate(selectedDate)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-xs hover:bg-primary/10 hover:text-primary"
                                            onClick={() => setIsAdding(!isAdding)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            {t('calendar.addEvent')}
                                        </Button>
                                    </div>

                                    {/* Add Event Form */}
                                    <AnimatePresence>
                                        {isAdding && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-2 p-2 bg-card rounded-lg border border-border"
                                            >
                                                {/* Event Type Pills */}
                                                <div className="flex flex-wrap gap-1">
                                                    {(Object.keys(eventTypeInfo) as CalendarEventType[]).map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setNewEventType(type)}
                                                            className={cn(
                                                                'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                                                                newEventType === type
                                                                    ? `${eventTypeInfo[type].color} text-white`
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            )}
                                                        >
                                                            {eventTypeInfo[type].icon} {eventTypeInfo[type].label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <Input
                                                    placeholder={t('calendar.eventTitle')}
                                                    value={newEventTitle}
                                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                                    className="h-8 text-xs bg-background border-border"
                                                />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">{t('calendar.time')}</label>
                                                        <Input
                                                            value={newEventTime}
                                                            onChange={(e) => setNewEventTime(e.target.value)}
                                                            className="h-8 text-xs bg-background border-border"
                                                            type="time"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">{t('calendar.roomNumber')}</label>
                                                        <Input
                                                            placeholder={t('log.roomPlaceholder')}
                                                            value={newEventRoom}
                                                            onChange={(e) => setNewEventRoom(e.target.value)}
                                                            className="h-8 text-xs bg-background border-border"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">{t('calendar.totalPrice')}</label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={newEventTotalPrice}
                                                            onChange={(e) => setNewEventTotalPrice(e.target.value)}
                                                            className="h-8 text-xs bg-background border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">{t('calendar.collectedAmount')}</label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={newEventCollected}
                                                            onChange={(e) => setNewEventCollected(e.target.value)}
                                                            className="h-8 text-xs bg-background border-border"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-500"
                                                        onClick={handleAddEvent}
                                                        disabled={!newEventTitle.trim()}
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        {t('log.save')}
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
                                        <p className="text-xs text-zinc-500 text-center py-2">{t('calendar.noEvents')}</p>
                                    ) : (
                                        <div className="space-y-1.5 md:max-h-32 md:overflow-y-auto scrollbar-thin">
                                            {selectedDateEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        'group relative flex items-start gap-3 p-3 rounded-xl border transition-all',
                                                        'glass hover:bg-muted/30',
                                                        event.is_completed ? 'opacity-60 grayscale-[0.5]' : 'border-border'
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => handleToggleComplete(event.id, event.is_completed)}
                                                        className={cn(
                                                            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                                            event.is_completed
                                                                ? 'bg-emerald-500 border-emerald-500'
                                                                : 'border-muted-foreground/30 group-hover:border-primary/50'
                                                        )}
                                                    >
                                                        {event.is_completed && <Check className="w-3 h-3 text-white" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn('text-[10px] px-1.5 py-0 h-5', eventTypeInfo[event.type]?.color)}
                                                            >
                                                                {eventTypeInfo[event.type]?.icon}
                                                            </Badge>
                                                            <span className={cn(
                                                                'text-sm font-medium text-foreground truncate',
                                                                event.is_completed && 'line-through text-muted-foreground'
                                                            )}>
                                                                {event.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                            {(event.time || event.room_number) && (
                                                                <div className="flex items-center gap-1.5">
                                                                    {event.time && <span className="text-foreground bg-muted px-1.5 rounded">{event.time}</span>}
                                                                    {event.room_number && <span className="font-mono text-muted-foreground">#{event.room_number}</span>}
                                                                </div>
                                                            )}

                                                            {/* Attribution */}
                                                            {event.created_by_name && (
                                                                <span className="text-primary/80">
                                                                    by {event.created_by_name}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {event.total_price !== null && (
                                                            <div className="pt-2 flex items-center gap-2 border-t border-border mt-2">
                                                                <div className="text-[11px] font-medium text-muted-foreground">
                                                                    {t('calendar.payment')}:
                                                                    <span className={cn(
                                                                        "ml-1.5",
                                                                        (event.collected_amount || 0) >= (event.total_price || 0)
                                                                            ? "text-emerald-400"
                                                                            : "text-amber-400"
                                                                    )}>
                                                                        {event.collected_amount || 0} / {event.total_price} €
                                                                    </span>
                                                                </div>
                                                                {updatingPaymentId === event.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            className="h-5 w-14 text-[9px] px-1 bg-background border-border"
                                                                            value={tempCollected}
                                                                            onChange={e => setTempCollected(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                        <button onClick={() => handleUpdatePayment(event.id)} className="text-emerald-500 hover:text-emerald-400">
                                                                            <Check className="w-3 h-3" />
                                                                        </button>
                                                                        <button onClick={() => setUpdatingPaymentId(null)} className="text-muted-foreground">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setUpdatingPaymentId(event.id)
                                                                            setTempCollected((event.collected_amount || 0).toString())
                                                                        }}
                                                                        className="text-[9px] text-primary hover:text-primary/80 underline underline-offset-2"
                                                                    >
                                                                        {t('common.update')}
                                                                    </button>
                                                                )}
                                                                {(event.total_price - (event.collected_amount || 0)) > 0 && (
                                                                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-rose-500/30 text-rose-400 lowercase leading-none">
                                                                        {t('calendar.remaining')}: {event.total_price - (event.collected_amount || 0)} €
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="text-muted-foreground hover:text-destructive p-1"
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
            </div>
        </CollapsibleCard >
    )
}
