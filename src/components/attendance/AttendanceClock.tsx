import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, LogIn, LogOut, TimerReset, TriangleAlert, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
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

const copy = {
    tr: {
        clockIn: 'Mesaiye Başla', clockOut: 'Mesaiyi Bitir', working: 'Mesaide',
        titleIn: 'Mesai başlangıcını kaydet', titleOut: 'Mesai bitişini kaydet',
        planned: 'Planlanan vardiya', actual: 'Şu an', late: 'geç',
        excuseLabel: 'Geç kalma mazereti', excusePlaceholder: 'Gecikme nedenini açıkça belirtin…',
        excuseHelp: 'Geç girişlerde mazeret zorunludur ve GM raporunda görünür.',
        permissionLabel: 'Yönetici izni alındı mı?', permissionYes: 'Evet, izin alındı', permissionNo: 'Hayır, izin alınmadı',
        permissionHelp: 'Bu beyan GM tarafından ayrıca onaylanacak veya reddedilecektir.',
        disciplinaryWarning: 'Clock-in veya clock-out kaydının yapılmaması halinde personel hakkında tutanak düzenlenecektir.',
        inDesc: 'Giriş saatiniz değiştirilemez bir denetim kaydı olarak saklanır.',
        outDesc: 'Çıkış saatiniz kaydedilecek ve çalışma süreniz hesaplanacak.',
        confirmIn: 'Girişi Kaydet', confirmOut: 'Çıkışı Kaydet', cancel: 'Vazgeç',
        failed: 'Mesai kaydı oluşturulamadı. Lütfen tekrar deneyin.',
        duplicate: 'Bu vardiya için giriş daha önce kaydedilmiş.',
    },
    en: {
        clockIn: 'Clock In', clockOut: 'Clock Out', working: 'On shift',
        titleIn: 'Record shift start', titleOut: 'Record shift end',
        planned: 'Scheduled shift', actual: 'Current time', late: 'late',
        excuseLabel: 'Late arrival excuse', excusePlaceholder: 'Clearly state the reason for the delay…',
        excuseHelp: 'An excuse is required for late arrivals and will appear in the GM report.',
        permissionLabel: 'Was manager permission obtained?', permissionYes: 'Yes, permission obtained', permissionNo: 'No permission obtained',
        permissionHelp: 'This declaration will be approved or rejected by a GM.',
        disciplinaryWarning: 'Failure to record clock-in or clock-out will result in a formal incident report for the employee.',
        inDesc: 'Your clock-in time is retained as an immutable audit record.',
        outDesc: 'Your clock-out time will be recorded and working duration calculated.',
        confirmIn: 'Record Clock In', confirmOut: 'Record Clock Out', cancel: 'Cancel',
        failed: 'Attendance could not be recorded. Please try again.',
        duplicate: 'Clock-in has already been recorded for this shift.',
    },
}

export function AttendanceClock() {
    const user = useAuthStore((state) => state.user)
    const hotel = useHotelStore((state) => state.hotel)
    const schedule = useRosterStore((state) => state.schedule)
    const records = useAttendanceStore((state) => state.records)
    const loading = useAttendanceStore((state) => state.loading)
    const clockIn = useAttendanceStore((state) => state.clockIn)
    const clockOut = useAttendanceStore((state) => state.clockOut)
    const language = useLanguageStore((state) => state.language)
    const labels = language === 'tr' ? copy.tr : copy.en
    const [now, setNow] = useState(() => new Date())
    const [open, setOpen] = useState(false)
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
            setOpen(true)
        }
    }, [activeRecord, assignment, existingRecord, loading, now, user])

    if (!user || user.role !== 'receptionist' || !hotel?.id || !assignment) return null
    if (existingRecord?.status === 'clocked_out' && !activeRecord) return null

    const handleSubmit = async () => {
        if (!activeRecord && lateMinutes > 0 && !excuse.trim()) return
        setSaving(true)
        try {
            if (activeRecord) {
                await clockOut(hotel.id, user, activeRecord.id)
            } else {
                await clockIn(hotel.id, user, assignment, excuse, managerPermission ?? undefined)
            }
            setOpen(false)
            setExcuse('')
            setManagerPermission(null)
        } catch (error) {
            const code = error instanceof Error ? error.message : ''
            toast.error(code === 'ALREADY_CLOCKED_IN' ? labels.duplicate : labels.failed)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant={activeRecord ? 'outline' : 'default'}
                onClick={() => setOpen(true)}
                className={cn(
                    'h-8 gap-2 rounded-lg px-2.5 text-xs font-semibold',
                    activeRecord && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400',
                )}
            >
                {activeRecord ? <TimerReset className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{activeRecord ? labels.working : labels.clockIn}</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md overflow-hidden p-0">
                    <DialogHeader className="border-b border-border/50 bg-muted/20 p-6">
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {activeRecord ? <LogOut className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                        </div>
                        <DialogTitle>{activeRecord ? labels.titleOut : labels.titleIn}</DialogTitle>
                        <DialogDescription>{activeRecord ? labels.outDesc : labels.inDesc}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels.planned}</p>
                                <p className="mt-1 text-sm font-bold">{assignment.shiftType} · {format(assignment.scheduledStart, 'HH:mm')}–{format(assignment.scheduledEnd, 'HH:mm')}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{assignment.workDate}</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels.actual}</p>
                                <p className="mt-1 text-sm font-bold tabular-nums">{format(now, 'HH:mm')}</p>
                                {!activeRecord && lateMinutes > 0 && <p className="mt-0.5 text-xs font-semibold text-amber-600">{lateMinutes} dk {labels.late}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="text-xs font-semibold leading-relaxed">{labels.disciplinaryWarning}</p>
                        </div>

                        {!activeRecord && lateMinutes > 0 && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold" htmlFor="late-excuse">{labels.excuseLabel} *</label>
                                    <Textarea
                                        id="late-excuse"
                                        value={excuse}
                                        onChange={(event) => setExcuse(event.target.value)}
                                        placeholder={labels.excusePlaceholder}
                                        maxLength={500}
                                        className="min-h-24 resize-none"
                                    />
                                    <p className="text-[11px] text-muted-foreground">{labels.excuseHelp}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold">{labels.permissionLabel} *</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={managerPermission === true ? 'default' : 'outline'}
                                            className="h-auto min-h-10 gap-2 whitespace-normal px-3 py-2 text-xs"
                                            onClick={() => setManagerPermission(true)}
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0" /> {labels.permissionYes}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={managerPermission === false ? 'destructive' : 'outline'}
                                            className="h-auto min-h-10 gap-2 whitespace-normal px-3 py-2 text-xs"
                                            onClick={() => setManagerPermission(false)}
                                        >
                                            <XCircle className="h-4 w-4 shrink-0" /> {labels.permissionNo}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{labels.permissionHelp}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>{labels.cancel}</Button>
                            <Button
                                className="flex-1 gap-2"
                                variant={activeRecord ? 'destructive' : 'default'}
                                onClick={handleSubmit}
                                disabled={saving || (!activeRecord && lateMinutes > 0 && (!excuse.trim() || managerPermission === null))}
                            >
                                {activeRecord ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                                {activeRecord ? labels.confirmOut : labels.confirmIn}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
