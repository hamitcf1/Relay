import { useMemo } from 'react'
import { format } from 'date-fns'
import {
    AlertTriangle,
    ArrowRight,
    BedDouble,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    DoorOpen,
    Info,
    LogIn,
    LogOut,
    Plus,
    RefreshCw,
    Users,
} from 'lucide-react'
import { useNotesStore } from '@/stores/notesStore'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useRoomStore } from '@/stores/roomStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { NotePriority, ShiftNote } from '@/types'

interface OperationsOverviewProps {
    onOpenNotes: () => void
    onOpenAttendance: () => void
    onOpenRooms: () => void
    onNewRecord: () => void
}

const priorityRank: Record<NotePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export function OperationsOverview({ onOpenNotes, onOpenAttendance, onOpenRooms, onNewRecord }: OperationsOverviewProps) {
    const notes = useNotesStore((state) => state.notes)
    const attendance = useAttendanceStore((state) => state.records)
    const schedule = useRosterStore((state) => state.schedule)
    const staff = useRosterStore((state) => state.activeStaff)
    const rooms = useRoomStore((state) => state.rooms)
    const language = useLanguageStore((state) => state.language)

    const copy = language === 'tr' ? {
        title: 'Operasyon özeti', mobileTitle: 'Operasyon', newRecord: 'Yeni kayıt', handover: 'Vardiya devri',
        handoverSub: 'Önceki vardiyadan devralınanlar', viewAll: 'Tümünü gör', today: 'Bugün', attendance: 'Mesai',
        scheduled: 'Vardiyada', arrived: 'Geldi', late: 'Geç kalan', off: 'İzinli', occupied: 'Dolu', clean: 'Temiz',
        openRequests: 'Açık talepler', critical: 'Kritik işler', priority: 'Öncelik', task: 'Başlık', location: 'Konum',
        assigned: 'Atanan', updated: 'Son güncelleme', status: 'Durum', inProgress: 'Devam ediyor', waiting: 'Bekliyor',
        planned: 'Planlandı', empty: 'Aktif operasyon kaydı yok', room: 'Oda', reception: 'Ön büro', team: 'Ekip',
        priority_low: 'Düşük', priority_medium: 'Orta', priority_high: 'Yüksek', priority_critical: 'Acil',
    } : language === 'ru' ? {
        title: 'Сводка операций', mobileTitle: 'Операции', newRecord: 'Новая запись', handover: 'Передача смены',
        handoverSub: 'Передано с предыдущей смены', viewAll: 'Смотреть все', today: 'Сегодня', attendance: 'Посещаемость',
        scheduled: 'В смене', arrived: 'Пришли', late: 'Опоздали', off: 'Выходной', occupied: 'Занято', clean: 'Готово',
        openRequests: 'Открытые запросы', critical: 'Критические задачи', priority: 'Приоритет', task: 'Задача', location: 'Место',
        assigned: 'Ответственный', updated: 'Обновлено', status: 'Статус', inProgress: 'В работе', waiting: 'Ожидает',
        planned: 'Запланировано', empty: 'Нет активных записей', room: 'Номер', reception: 'Ресепшен', team: 'Команда',
        priority_low: 'Низкий', priority_medium: 'Средний', priority_high: 'Высокий', priority_critical: 'Срочно',
    } : {
        title: 'Operations overview', mobileTitle: 'Operations', newRecord: 'New record', handover: 'Shift handover',
        handoverSub: 'Carried over from the previous shift', viewAll: 'View all', today: 'Today', attendance: 'Attendance',
        scheduled: 'Scheduled', arrived: 'Arrived', late: 'Late', off: 'Off', occupied: 'Occupied', clean: 'Clean',
        openRequests: 'Open requests', critical: 'Critical tasks', priority: 'Priority', task: 'Task', location: 'Location',
        assigned: 'Assigned', updated: 'Last update', status: 'Status', inProgress: 'In progress', waiting: 'Waiting',
        planned: 'Planned', empty: 'No active operational records', room: 'Room', reception: 'Front desk', team: 'Team',
        priority_low: 'Low', priority_medium: 'Medium', priority_high: 'High', priority_critical: 'Critical',
    }

    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const activeNotes = useMemo(() => notes
        .filter((note) => note.status === 'active')
        .sort((a, b) => {
            const priorityDelta = priorityRank[a.priority || 'low'] - priorityRank[b.priority || 'low']
            return priorityDelta || b.created_at.getTime() - a.created_at.getTime()
        }), [notes])
    const todayRecords = attendance.filter((record) => record.work_date === todayKey)
    const arrived = new Set(todayRecords.map((record) => record.staff_id)).size
    const late = todayRecords.filter((record) => record.late_minutes > 0).length
    const scheduled = staff.filter((member) => schedule[member.uid]?.[todayKey] && schedule[member.uid][todayKey] !== 'OFF').length
    const off = staff.filter((member) => schedule[member.uid]?.[todayKey] === 'OFF').length
    const occupied = rooms.filter((room) => room.occupancy === 'occupied').length
    const clean = rooms.filter((room) => room.status === 'clean').length
    const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0
    const cleanliness = rooms.length ? Math.round((clean / rooms.length) * 100) : 0

    return (
        <section className="ops-overview">
            <header className="ops-overview__titlebar">
                <div>
                    <p className="ops-overview__eyebrow">Relay / live operations</p>
                    <h1><span className="hidden sm:inline">{copy.title}</span><span className="sm:hidden">{copy.mobileTitle}</span></h1>
                </div>
                <button className="ops-primary-action" onClick={onNewRecord}>
                    <span>{copy.newRecord}</span><span className="ops-primary-action__icon"><Plus /></span>
                </button>
            </header>

            <div className="ops-overview__topgrid">
                <OverviewPanel className="ops-handover" title={copy.handover} subtitle={copy.handoverSub} icon={RefreshCw} action={copy.viewAll} onAction={onOpenNotes}>
                    <div className="ops-list">
                        {activeNotes.slice(0, 4).map((note) => <NoteRow key={note.id} note={note} copy={copy} onClick={onOpenNotes} />)}
                        {!activeNotes.length && <EmptyState label={copy.empty} />}
                    </div>
                </OverviewPanel>

                <OverviewPanel className="ops-today" title={copy.today} icon={CalendarDays} action={copy.viewAll} onAction={onOpenRooms}>
                    <div className="ops-today-list">
                        <MetricRow icon={LogIn} label={copy.arrived} value={arrived} detail={`${copy.scheduled} ${scheduled}`} />
                        <MetricRow icon={LogOut} label={copy.off} value={off} detail={copy.planned} tone="copper" />
                        <MetricRow icon={BedDouble} label={copy.occupied} value={`${occupancy}%`} detail={`${occupied} / ${rooms.length || '—'}`} />
                        <MetricRow icon={CheckCircle2} label={copy.clean} value={`${cleanliness}%`} detail={`${clean} / ${rooms.length || '—'}`} tone="success" />
                        <MetricRow icon={AlertTriangle} label={copy.openRequests} value={activeNotes.length} detail={copy.reception} tone="warning" />
                    </div>
                </OverviewPanel>
            </div>

            <section className="ops-attendance" aria-label={copy.attendance}>
                <button className="ops-attendance__heading" onClick={onOpenAttendance}>
                    <span className="ops-section-icon"><Clock3 /></span><strong>{copy.attendance}</strong>
                </button>
                <div className="ops-attendance__metrics">
                    <AttendanceMetric value={scheduled} label={copy.scheduled} tone="neutral" icon={Users} />
                    <AttendanceMetric value={arrived} label={copy.arrived} tone="success" icon={CheckCircle2} />
                    <AttendanceMetric value={late} label={copy.late} tone="warning" icon={Clock3} />
                    <AttendanceMetric value={off} label={copy.off} tone="muted" icon={DoorOpen} />
                </div>
                <button className="ops-view-link ops-attendance__link" onClick={onOpenAttendance}>{copy.viewAll}<ArrowRight /></button>
            </section>

            <OverviewPanel className="ops-critical" title={copy.critical} icon={AlertTriangle} action={copy.viewAll} onAction={onOpenNotes}>
                <div className="ops-critical__desktop">
                    <table>
                        <thead><tr><th>{copy.priority}</th><th>{copy.task}</th><th>{copy.location}</th><th>{copy.assigned}</th><th>{copy.updated}</th><th>{copy.status}</th></tr></thead>
                        <tbody>{activeNotes.slice(0, 8).map((note) => <CriticalRow key={note.id} note={note} copy={copy} />)}</tbody>
                    </table>
                    {!activeNotes.length && <EmptyState label={copy.empty} />}
                </div>
                <div className="ops-critical__mobile ops-list">
                    {activeNotes.slice(0, 4).map((note) => <NoteRow key={note.id} note={note} copy={copy} onClick={onOpenNotes} />)}
                    {!activeNotes.length && <EmptyState label={copy.empty} />}
                </div>
            </OverviewPanel>
        </section>
    )
}

function OverviewPanel({ title, subtitle, icon: Icon, action, onAction, className = '', children }: {
    title: string; subtitle?: string; icon: typeof Clock3; action: string; onAction: () => void; className?: string; children: React.ReactNode
}) {
    return <section className={`ops-panel ${className}`}>
        <div className="ops-panel__inner">
            <header className="ops-panel__header">
                <div className="ops-panel__title"><span className="ops-section-icon"><Icon /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>
                <button className="ops-view-link" onClick={onAction}>{action}<ChevronRight /></button>
            </header>
            {children}
        </div>
    </section>
}

function NoteRow({ note, copy, onClick }: { note: ShiftNote; copy: Record<string, string>; onClick: () => void }) {
    const priority = note.priority || 'low'
    const Icon = priority === 'critical' ? AlertTriangle : priority === 'high' ? AlertTriangle : Info
    return <button className="ops-note-row" onClick={onClick}>
        <span className={`ops-note-row__icon ops-tone-${priority}`}><Icon /></span>
        <span className="ops-note-row__body"><strong>{note.content}</strong><small>{note.room_number ? `${copy.room} ${note.room_number}` : note.assigned_staff_name || note.created_by_name}</small></span>
        <PriorityBadge priority={priority} label={copy[`priority_${priority}`]} />
        <time>{format(note.updated_at || note.created_at, 'HH:mm')}</time>
        <ChevronRight className="ops-note-row__chevron" />
    </button>
}

function CriticalRow({ note, copy }: { note: ShiftNote; copy: Record<string, string> }) {
    const priority = note.priority || 'low'
    return <tr>
        <td><PriorityBadge priority={priority} label={copy[`priority_${priority}`]} /></td><td>{note.content}</td><td>{note.room_number ? `${copy.room} ${note.room_number}` : copy.reception}</td>
        <td>{note.assigned_staff_name || copy.team}</td><td>{format(note.updated_at || note.created_at, 'HH:mm')}</td>
        <td><span className={`ops-status ops-status--${priority}`}>{priority === 'critical' || priority === 'high' ? copy.inProgress : priority === 'medium' ? copy.waiting : copy.planned}</span></td>
    </tr>
}

function PriorityBadge({ priority, label }: { priority: NotePriority; label: string }) {
    return <span className={`ops-priority ops-priority--${priority}`}><span />{label}</span>
}

function MetricRow({ icon: Icon, label, value, detail, tone = 'neutral' }: { icon: typeof Clock3; label: string; value: string | number; detail: string; tone?: string }) {
    return <div className="ops-metric-row"><span className={`ops-metric-row__icon ops-metric-row__icon--${tone}`}><Icon /></span><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function AttendanceMetric({ value, label, tone, icon: Icon }: { value: number; label: string; tone: string; icon: typeof Clock3 }) {
    return <div className={`ops-attendance-metric ops-attendance-metric--${tone}`}><span><Icon /></span><strong>{value}</strong><small>{label}</small></div>
}

function EmptyState({ label }: { label: string }) {
    return <div className="ops-empty"><CheckCircle2 /><span>{label}</span></div>
}
