import { cn } from '@/lib/utils'

type Staff = { uid: string; name: string }
export function MobileRosterEmployeeView({ staff, selectedStaff, onStaffChange, days, schedule, canEdit, onCell, getLabel, getTone }: { staff: Staff[]; selectedStaff: string; onStaffChange: (uid: string) => void; days: { day: string; label: string; date: string }[]; schedule: Record<string, Record<string, string | null>>; canEdit: boolean; onCell: (uid: string, day: string) => void; getLabel: (shift: string) => string; getTone: (shift: string) => string }) {
    const member = staff.find((item) => item.uid === selectedStaff) || staff[0]
    if (!member) return null
    return (
        <div className="space-y-3 md:hidden">
            <select
                aria-label="Employee"
                value={member.uid}
                onChange={(event) => onStaffChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-card px-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
                {staff.map((item) => (
                    <option key={item.uid} value={item.uid}>{item.name}</option>
                ))}
            </select>
            <div className="space-y-2">
                {days.map((item) => {
                    const shift = schedule[member.uid]?.[item.day] || null
                    return (
                        <button
                            key={item.day}
                            disabled={!canEdit}
                            onClick={() => onCell(member.uid, item.day)}
                            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-left shadow-2xs transition-all active:scale-[0.99]"
                        >
                            <span>
                                <strong className="block text-sm font-semibold text-foreground">{item.label}</strong>
                                <small className="text-muted-foreground font-mono text-[11px]">{item.date}</small>
                            </span>
                            <span className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold font-mono tracking-wide', shift ? getTone(shift) : 'border-border/60 bg-muted/40 text-muted-foreground')}>
                                {shift ? getLabel(shift) : '—'}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
