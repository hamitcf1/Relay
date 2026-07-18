import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { CheckCircle2, Clock3, Download, Loader2, Search, ShieldCheck, ShieldQuestion, TimerOff, TriangleAlert, Users, XCircle } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AttendanceRecord } from '@/types'
import type { Translations } from '@/i18n/types'

function durationLabel(minutes: number | null, t: (key: keyof Translations) => string) {
    if (minutes == null) return '—'
    return `${Math.floor(minutes / 60)} ${t('attendance.unit.hour')} ${minutes % 60} ${t('attendance.unit.minute')}`
}

function csvCell(value: string | number) {
    return `"${String(value).replace(/"/g, '""')}"`
}

export function AttendanceReportPanel() {
    const user = useAuthStore((state) => state.user)
    const records = useAttendanceStore((state) => state.records)
    const loading = useAttendanceStore((state) => state.loading)
    const reviewLateArrival = useAttendanceStore((state) => state.reviewLateArrival)
    const t = useLanguageStore((state) => state.t)
    const text = {
        title: t('attendance.report.title'), desc: t('attendance.report.desc'), total: t('attendance.report.total'),
        late: t('attendance.report.late'), active: t('attendance.report.active'), avgLate: t('attendance.report.avgLate'),
        minute: t('attendance.unit.minute'), pending: t('attendance.report.pending'), search: t('attendance.report.search'),
        export: t('attendance.report.export'), employee: t('attendance.report.employee'), date: t('attendance.report.date'),
        planned: t('attendance.report.planned'), in: t('attendance.report.clockIn'), out: t('attendance.report.clockOut'),
        declaredIn: t('attendance.report.declaredClockIn'), actualIn: t('attendance.report.actualClockIn'),
        declaredOut: t('attendance.report.declaredClockOut'), actualOut: t('attendance.report.actualClockOut'),
        gmAuditNote: t('attendance.report.gmAuditNote'),
        duration: t('attendance.report.duration'), status: t('attendance.report.status'), excuse: t('attendance.report.excuse'),
        permission: t('attendance.report.permission'), onTime: t('attendance.report.onTime'), working: t('attendance.report.working'),
        completed: t('attendance.report.completed'), noExit: t('attendance.report.noExit'), permissionYes: t('attendance.report.permissionYes'),
        permissionNo: t('attendance.report.permissionNo'), approvalPending: t('attendance.report.approvalPending'),
        approved: t('attendance.report.approved'), rejected: t('attendance.report.rejected'), approve: t('attendance.report.approve'),
        reject: t('attendance.report.reject'), reviewTitleApprove: t('attendance.report.reviewTitleApprove'),
        reviewTitleReject: t('attendance.report.reviewTitleReject'), reviewDesc: t('attendance.report.reviewDesc'),
        reviewNote: t('attendance.report.reviewNote'), reviewNotePlaceholder: t('attendance.report.reviewNotePlaceholder'),
        rejectionRequired: t('attendance.report.rejectionRequired'), cancel: t('attendance.clock.cancel'),
        saveDecision: t('attendance.report.saveDecision'), empty: t('attendance.report.empty'), access: t('attendance.report.access'),
    }
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [search, setSearch] = useState('')
    const [reviewTarget, setReviewTarget] = useState<{ record: AttendanceRecord; decision: 'approved' | 'rejected' } | null>(null)
    const [reviewNote, setReviewNote] = useState('')
    const [reviewing, setReviewing] = useState(false)

    const filtered = useMemo(() => records
        .filter((record) => record.work_date >= fromDate && record.work_date <= toDate)
        .filter((record) => record.staff_name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
        .sort((a, b) => (b.actual_clock_in_at || b.declared_clock_in_at).getTime() - (a.actual_clock_in_at || a.declared_clock_in_at).getTime()), [fromDate, records, search, toDate])

    const lateRecords = filtered.filter((record) => record.late_minutes > 0)
    const averageLate = lateRecords.length
        ? Math.round(lateRecords.reduce((total, record) => total + record.late_minutes, 0) / lateRecords.length)
        : 0

    if (user?.role !== 'gm') {
        return <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">{text.access}</div>
    }

    const exportCsv = () => {
        const header = [
            text.employee, text.date, t('attendance.report.shiftLabel'),
            t('attendance.report.scheduledIn'), t('attendance.report.scheduledOut'),
            text.declaredIn, text.actualIn, text.declaredOut, text.actualOut,
            t('attendance.report.lateMinutes'), text.excuse, t('attendance.report.permissionDeclaration'),
            t('attendance.report.approvalStatus'), t('attendance.report.reviewedBy'), t('attendance.report.reviewedAt'),
            text.reviewNote, t('attendance.report.workedMinutes'), text.status,
        ]
        const rows = filtered.map((record) => [
            record.staff_name, record.work_date, record.shift_type,
            format(record.scheduled_start, 'yyyy-MM-dd HH:mm'), format(record.scheduled_end, 'yyyy-MM-dd HH:mm'),
            format(record.declared_clock_in_at, 'yyyy-MM-dd HH:mm:ss'),
            record.actual_clock_in_at ? format(record.actual_clock_in_at, 'yyyy-MM-dd HH:mm:ss') : '',
            record.declared_clock_out_at ? format(record.declared_clock_out_at, 'yyyy-MM-dd HH:mm:ss') : '',
            record.actual_clock_out_at ? format(record.actual_clock_out_at, 'yyyy-MM-dd HH:mm:ss') : '',
            record.late_minutes, record.late_excuse || '',
            record.manager_permission_declared == null ? '' : record.manager_permission_declared ? text.permissionYes : text.permissionNo,
            record.approval_status === 'approved' ? text.approved : record.approval_status === 'rejected' ? text.rejected : text.approvalPending,
            record.reviewed_by_name || '', record.reviewed_at ? format(record.reviewed_at, 'yyyy-MM-dd HH:mm:ss') : '', record.review_note || '',
            record.worked_minutes ?? '', record.status === 'clocked_in' ? text.working : text.completed,
        ])
        const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\n')}`
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `mesai-raporu-${fromDate}-${toDate}.csv`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const stats = [
        { label: text.total, value: filtered.length, icon: Users, color: 'text-primary bg-primary/10' },
        { label: text.late, value: lateRecords.length, icon: TriangleAlert, color: 'text-amber-600 bg-amber-500/10' },
        { label: text.active, value: filtered.filter((record) => record.status === 'clocked_in').length, icon: Clock3, color: 'text-emerald-600 bg-emerald-500/10' },
        { label: text.avgLate, value: `${averageLate} ${text.minute}`, icon: TimerOff, color: 'text-rose-600 bg-rose-500/10' },
        { label: text.pending, value: filtered.filter((record) => record.approval_status === 'pending').length, icon: ShieldQuestion, color: 'text-primary bg-primary/10' },
    ]

    const submitReview = async () => {
        if (!reviewTarget || !user) return
        setReviewing(true)
        try {
            await reviewLateArrival(user.hotel_id || '', user, reviewTarget.record.id, reviewTarget.decision, reviewNote)
            setReviewTarget(null)
            setReviewNote('')
        } finally {
            setReviewing(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1500px] space-y-5 p-1 lg:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{text.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text.desc}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-9 w-auto" />
                    <span className="text-muted-foreground">–</span>
                    <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-9 w-auto" />
                    <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length} className="gap-2">
                        <Download className="h-4 w-4" /> {text.export}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-border/50 bg-card/60">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
                            <div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-xl font-bold tabular-nums">{stat.value}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="overflow-hidden border-border/50 bg-card/60">
                <div className="flex flex-col gap-3 border-b border-border/50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="pl-9" />
                    </div>
                    <div className="flex max-w-xl items-start gap-2 rounded-lg bg-primary/[0.06] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-primary/15">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{text.gmAuditNote}</span>
                    </div>
                </div>
                {loading ? (
                    <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : !filtered.length ? (
                    <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">{text.empty}</div>
                ) : (
                    <>
                    <div className="space-y-3 p-3 md:hidden">
                        {filtered.map((record) => (
                            <article key={record.id} className="rounded-[1.15rem] bg-muted/25 p-4 ring-1 ring-border/60">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold tracking-tight">{record.staff_name}</h3>
                                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{record.staff_role} · {record.work_date}</p>
                                    </div>
                                    <Badge variant={record.status === 'clocked_in' ? 'default' : 'secondary'}>{record.status === 'clocked_in' ? text.working : text.completed}</Badge>
                                </div>
                                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-background/40 p-3 text-xs">
                                    <div><dt className="text-muted-foreground">{text.planned}</dt><dd className="mt-1 font-mono font-semibold">{format(record.scheduled_start, 'HH:mm')}–{format(record.scheduled_end, 'HH:mm')}</dd></div>
                                    <div><dt className="text-muted-foreground">{text.duration}</dt><dd className="mt-1 font-semibold">{durationLabel(record.worked_minutes, t)}</dd></div>
                                    <div><dt className="text-muted-foreground">{text.declaredIn}</dt><dd className="mt-1 font-mono font-semibold">{format(record.declared_clock_in_at, 'HH:mm:ss')}</dd></div>
                                    <div><dt className="text-primary">{text.actualIn}</dt><dd className="mt-1 font-mono font-semibold">{record.actual_clock_in_at ? format(record.actual_clock_in_at, 'HH:mm:ss') : '—'}</dd></div>
                                    <div><dt className="text-muted-foreground">{text.declaredOut}</dt><dd className="mt-1 font-mono font-semibold">{record.declared_clock_out_at ? format(record.declared_clock_out_at, 'HH:mm:ss') : text.noExit}</dd></div>
                                    <div><dt className="text-primary">{text.actualOut}</dt><dd className="mt-1 font-mono font-semibold">{record.actual_clock_out_at ? format(record.actual_clock_out_at, 'HH:mm:ss') : text.noExit}</dd></div>
                                </dl>
                                {record.late_minutes > 0 && (
                                    <div className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs ring-1 ring-amber-500/20">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-amber-600">+{record.late_minutes} {text.minute}</span>
                                            <Badge variant="secondary">{record.approval_status === 'approved' ? text.approved : record.approval_status === 'rejected' ? text.rejected : text.approvalPending}</Badge>
                                        </div>
                                        <p className="mt-2 leading-relaxed text-muted-foreground">{record.late_excuse || '—'}</p>
                                        <p className="mt-2 font-medium">{record.manager_permission_declared ? text.permissionYes : text.permissionNo}</p>
                                        {record.approval_status === 'pending' && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <Button size="sm" onClick={() => { setReviewTarget({ record, decision: 'approved' }); setReviewNote('') }}><CheckCircle2 className="h-3.5 w-3.5" />{text.approve}</Button>
                                                <Button size="sm" variant="destructive" onClick={() => { setReviewTarget({ record, decision: 'rejected' }); setReviewNote('') }}><XCircle className="h-3.5 w-3.5" />{text.reject}</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                    <div className="relay-table-scroll hidden md:block">
                        <table className="w-full min-w-[1520px] text-left text-sm">
                            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                                <tr>{[text.employee, text.date, text.planned, text.declaredIn, text.actualIn, text.declaredOut, text.actualOut, text.duration, text.status, text.excuse, text.permission].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filtered.map((record) => (
                                    <tr key={record.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-semibold">{record.staff_name}<div className="text-[10px] font-normal uppercase text-muted-foreground">{record.staff_role}</div></td>
                                        <td className="px-4 py-3"><span className="font-medium">{record.work_date}</span><div className="text-xs text-muted-foreground">{t('attendance.report.shift', { type: record.shift_type })}</div></td>
                                        <td className="px-4 py-3 font-mono text-xs">{format(record.scheduled_start, 'HH:mm')}–{format(record.scheduled_end, 'HH:mm')}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{format(record.declared_clock_in_at, 'HH:mm:ss')}<div className={record.late_minutes > 0 ? 'text-amber-600' : 'text-emerald-600'}>{record.late_minutes > 0 ? `+${record.late_minutes} ${text.minute}` : text.onTime}</div></td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{record.actual_clock_in_at ? format(record.actual_clock_in_at, 'HH:mm:ss') : '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{record.declared_clock_out_at ? format(record.declared_clock_out_at, 'HH:mm:ss') : <span className="font-sans text-muted-foreground">{text.noExit}</span>}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{record.actual_clock_out_at ? format(record.actual_clock_out_at, 'HH:mm:ss') : <span className="font-sans font-normal text-muted-foreground">{text.noExit}</span>}</td>
                                        <td className="px-4 py-3 font-medium">{durationLabel(record.worked_minutes, t)}</td>
                                        <td className="px-4 py-3"><Badge variant={record.status === 'clocked_in' ? 'default' : 'secondary'}>{record.status === 'clocked_in' ? text.working : text.completed}</Badge></td>
                                        <td className="max-w-[260px] px-4 py-3 text-xs text-muted-foreground"><span className="line-clamp-2" title={record.late_excuse || ''}>{record.late_excuse || '—'}</span></td>
                                        <td className="min-w-[220px] px-4 py-3 text-xs">
                                            {record.late_minutes <= 0 ? '—' : (
                                                <div className="space-y-2">
                                                    <div className={record.manager_permission_declared ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {record.manager_permission_declared ? text.permissionYes : text.permissionNo}
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={record.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : record.approval_status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}
                                                    >
                                                        {record.approval_status === 'approved' ? text.approved : record.approval_status === 'rejected' ? text.rejected : text.approvalPending}
                                                    </Badge>
                                                    {record.approval_status === 'pending' ? (
                                                        <div className="flex gap-1.5">
                                                            <Button size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => { setReviewTarget({ record, decision: 'approved' }); setReviewNote('') }}><CheckCircle2 className="h-3.5 w-3.5" />{text.approve}</Button>
                                                            <Button size="sm" variant="destructive" className="h-7 gap-1 px-2 text-[11px]" onClick={() => { setReviewTarget({ record, decision: 'rejected' }); setReviewNote('') }}><XCircle className="h-3.5 w-3.5" />{text.reject}</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] leading-relaxed text-muted-foreground" title={record.review_note || ''}>
                                                            {record.reviewed_by_name}{record.reviewed_at ? ` · ${format(record.reviewed_at, 'dd.MM HH:mm')}` : ''}
                                                            {record.review_note ? <div className="line-clamp-2">{record.review_note}</div> : null}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </Card>

            <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{reviewTarget?.decision === 'approved' ? text.reviewTitleApprove : text.reviewTitleReject}</DialogTitle>
                        <DialogDescription>{text.reviewDesc}</DialogDescription>
                    </DialogHeader>
                    {reviewTarget && (
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
                            <span className="font-semibold">{reviewTarget.record.staff_name}</span>
                            <span className="text-muted-foreground"> · {reviewTarget.record.work_date} · +{reviewTarget.record.late_minutes} {text.minute}</span>
                            <p className="mt-1 text-xs text-muted-foreground">{reviewTarget.record.late_excuse}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold" htmlFor="review-note">{text.reviewNote}{reviewTarget?.decision === 'rejected' ? ' *' : ''}</label>
                        <Textarea id="review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={text.reviewNotePlaceholder} maxLength={500} className="min-h-24 resize-none" />
                        {reviewTarget?.decision === 'rejected' && <p className="text-[11px] text-muted-foreground">{text.rejectionRequired}</p>}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setReviewTarget(null)} disabled={reviewing}>{text.cancel}</Button>
                        <Button
                            className="flex-1"
                            variant={reviewTarget?.decision === 'rejected' ? 'destructive' : 'default'}
                            onClick={submitReview}
                            disabled={reviewing || (reviewTarget?.decision === 'rejected' && !reviewNote.trim())}
                        >
                            {reviewing && <Loader2 className="h-4 w-4 animate-spin" />}{text.saveDecision}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
