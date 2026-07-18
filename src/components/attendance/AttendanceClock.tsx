import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, LogIn, LogOut, ShieldCheck, TimerReset, TriangleAlert, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useLanguageStore } from '@/stores/languageStore'
import { findRelevantAssignment, minutesLate } from '@/lib/attendance'
import { cn } from '@/lib/utils'

function declaredDateFromTime(time: string, reference: Date) {
    const [hours, minutes] = time.split(':').map(Number)
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return new Date(Number.NaN)
    }

    const candidates = [-1, 0, 1].map((dayOffset) => {
        const candidate = new Date(reference)
        candidate.setDate(candidate.getDate() + dayOffset)
        candidate.setHours(hours, minutes, 0, 0)
        return candidate
    })
    return candidates.sort((a, b) => Math.abs(a.getTime() - reference.getTime()) - Math.abs(b.getTime() - reference.getTime()))[0]
}

export function AttendanceClock() {
    const user = useAuthStore((state) => state.user)
    const hotel = useHotelStore((state) => state.hotel)
    const schedule = useRosterStore((state) => state.schedule)
    const records = useAttendanceStore((state) => state.records)
    const loading = useAttendanceStore((state) => state.loading)
    const clockIn = useAttendanceStore((state) => state.clockIn)
    const clockOut = useAttendanceStore((state) => state.clockOut)
    const t = useLanguageStore((state) => state.t)
    const [now, setNow] = useState(() => new Date())
    const [open, setOpen] = useState(false)
    const [declaredTime, setDeclaredTime] = useState(() => format(new Date(), 'HH:mm'))
    const [excuse, setExcuse] = useState('')
    const [managerPermission, setManagerPermission] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000)
        return () => window.clearInterval(timer)
    }, [])

    const activeRecord = useMemo(
        () => records.find((record) => record.staff_id === user?.uid && record.status === 'clocked_in') || null,
        [records, user?.uid],
    )

    const assignment = useMemo(() => {
        if (!user) return null
        if (activeRecord) {
            return {
                workDate: activeRecord.work_date,
                shiftType: activeRecord.shift_type,
                scheduledStart: activeRecord.scheduled_start,
                scheduledEnd: activeRecord.scheduled_end,
            }
        }
        return findRelevantAssignment(
            now,
            schedule[user.uid],
            user.current_shift_type,
            hotel?.settings,
        )
    }, [activeRecord, hotel?.settings, now, schedule, user])

    const existingRecord = assignment
        ? records.find((record) => record.staff_id === user?.uid && record.work_date === assignment.workDate && record.shift_type === assignment.shiftType)
        : null
    const lateMinutes = assignment ? minutesLate(now, assignment.scheduledStart) : 0

    useEffect(() => {
        if (loading || !user || user.role !== 'receptionist' || !assignment) return
        const promptType = activeRecord && now >= assignment.scheduledEnd ? 'out' : !existingRecord && now >= assignment.scheduledStart ? 'in' : null
        if (!promptType) return
        const promptKey = `relay_attendance_prompt_${assignment.workDate}_${assignment.shiftType}_${promptType}`
        if (!sessionStorage.getItem(promptKey)) {
            sessionStorage.setItem(promptKey, 'shown')
            setDeclaredTime(format(new Date(), 'HH:mm'))
            setOpen(true)
        }
    }, [activeRecord, assignment, existingRecord, loading, now, user])

    if (!user || user.role !== 'receptionist' || !hotel?.id || !assignment) return null
    if (existingRecord?.status === 'clocked_out' && !activeRecord) return null

    const handleSubmit = async () => {
        if (!activeRecord && lateMinutes > 0 && !excuse.trim()) return
        const declaredAt = declaredDateFromTime(declaredTime, now)
        if (Number.isNaN(declaredAt.getTime())) {
            toast.error(t('attendance.clock.invalidDeclaredTime'))
            return
        }
        setSaving(true)
        try {
            if (activeRecord) {
                await clockOut(hotel.id, user, activeRecord.id, declaredAt)
            } else {
                await clockIn(hotel.id, user, assignment, declaredAt, excuse, managerPermission ?? undefined)
            }
            setOpen(false)
            setExcuse('')
            setManagerPermission(null)
        } catch (error) {
            const code = error instanceof Error ? error.message : ''
            toast.error(code === 'ALREADY_CLOCKED_IN'
                ? t('attendance.clock.duplicate')
                : code === 'INVALID_DECLARED_TIME'
                    ? t('attendance.clock.invalidDeclaredTime')
                    : t('attendance.clock.failed'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant={activeRecord ? 'outline' : 'default'}
                onClick={() => {
                    setDeclaredTime(format(new Date(), 'HH:mm'))
                    setOpen(true)
                }}
                className={cn(
                    'h-8 gap-2 rounded-lg px-2.5 text-xs font-semibold',
                    activeRecord && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400',
                )}
            >
                {activeRecord ? <TimerReset className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{activeRecord ? t('attendance.clock.working') : t('attendance.clock.clockIn')}</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-md flex-col overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)]">
                    <DialogHeader className="shrink-0 border-b border-border/50 bg-muted/20 p-4 pr-12 sm:p-5 sm:pr-12">
                        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {activeRecord ? <LogOut className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                        </div>
                        <DialogTitle>{activeRecord ? t('attendance.clock.titleOut') : t('attendance.clock.titleIn')}</DialogTitle>
                        <DialogDescription className="max-w-[42ch] text-pretty leading-relaxed">{activeRecord ? t('attendance.clock.outDesc') : t('attendance.clock.inDesc')}</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('attendance.clock.planned')}</p>
                                <p className="mt-1 text-sm font-bold">{assignment.shiftType} · {format(assignment.scheduledStart, 'HH:mm')}–{format(assignment.scheduledEnd, 'HH:mm')}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{assignment.workDate}</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('attendance.clock.actual')}</p>
                                <p className="mt-1 text-sm font-bold tabular-nums">{format(now, 'HH:mm')}</p>
                                {!activeRecord && lateMinutes > 0 && <p className="mt-0.5 text-xs font-semibold text-amber-600">{lateMinutes} {t('attendance.unit.minute')} {t('attendance.clock.late')}</p>}
                            </div>
                        </div>

                        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5">
                            <label className="text-xs font-semibold" htmlFor="declared-attendance-time">
                                {activeRecord ? t('attendance.clock.declaredOut') : t('attendance.clock.declaredIn')} *
                            </label>
                            <Input
                                id="declared-attendance-time"
                                type="time"
                                value={declaredTime}
                                onChange={(event) => setDeclaredTime(event.target.value)}
                                className="h-11 bg-background font-mono text-base font-semibold tabular-nums"
                                required
                            />
                            <div className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <p>{t('attendance.clock.auditHelp')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="text-xs font-semibold leading-relaxed">{t('attendance.clock.disciplinaryWarning')}</p>
                        </div>

                        {!activeRecord && lateMinutes > 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold" htmlFor="late-excuse">{t('attendance.clock.excuseLabel')} *</label>
                                    <Textarea
                                        id="late-excuse"
                                        value={excuse}
                                        onChange={(event) => setExcuse(event.target.value)}
                                        placeholder={t('attendance.clock.excusePlaceholder')}
                                        maxLength={500}
                                        className="min-h-24 resize-none"
                                    />
                                    <p className="text-[11px] text-muted-foreground">{t('attendance.clock.excuseHelp')}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold">{t('attendance.clock.permissionLabel')} *</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={managerPermission === true ? 'default' : 'outline'}
                                            className="h-auto min-h-10 gap-2 whitespace-normal px-3 py-2 text-xs"
                                            onClick={() => setManagerPermission(true)}
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0" /> {t('attendance.clock.permissionYes')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={managerPermission === false ? 'destructive' : 'outline'}
                                            className="h-auto min-h-10 gap-2 whitespace-normal px-3 py-2 text-xs"
                                            onClick={() => setManagerPermission(false)}
                                        >
                                            <XCircle className="h-4 w-4 shrink-0" /> {t('attendance.clock.permissionNo')}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{t('attendance.clock.permissionHelp')}</p>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border/50 bg-background/95 p-4 backdrop-blur sm:px-5">
                            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>{t('attendance.clock.cancel')}</Button>
                            <Button
                                className="flex-1 gap-2"
                                variant={activeRecord ? 'destructive' : 'default'}
                                onClick={handleSubmit}
                                disabled={saving || !declaredTime || (!activeRecord && lateMinutes > 0 && (!excuse.trim() || managerPermission === null))}
                            >
                                {activeRecord ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                                {activeRecord ? t('attendance.clock.confirmOut') : t('attendance.clock.confirmIn')}
                            </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
