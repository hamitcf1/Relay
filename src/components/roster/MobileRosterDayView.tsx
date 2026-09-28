import { cn } from '@/lib/utils'

type Staff = { uid: string; name: string }
export function MobileRosterDayView({ staff, days, selectedDay, onDayChange, schedule, canEdit, onCell, getLabel, getTone }: { staff: Staff[]; days: { day: string; label: string; date: string; isToday: boolean }[]; selectedDay: string; onDayChange: (day: string) => void; schedule: Record<string, Record<string, string | null>>; canEdit: boolean; onCell: (uid: string, day: string) => void; getLabel: (shift: string) => string; getTone: (shift: string) => string }) {
    return (
        <div className="space-y-3 md:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {days.map((item) => (
                    <button
                        key={item.day}
                        onClick={() => onDayChange(item.day)}
                        className={cn(
                            'min-w-[3.75rem] rounded-xl px-2.5 py-2.5 text-center text-xs transition-all active:scale-95 shrink-0',
                            selectedDay === item.day ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        )}
                    >
                        <strong className="block">{item.label}</strong>
                        <span className="mt-0.5 block text-[10px] opacity-80 font-mono">{item.date}</span>
                    </button>
                ))}
            </div>
            <div className="space-y-2">
                {staff.map((member) => {
                    const shift = schedule[member.uid]?.[selectedDay] || null
                    return (
                        <button
                            key={member.uid}
                            disabled={!canEdit}
                            onClick={() => onCell(member.uid, selectedDay)}
                            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-left shadow-2xs transition-all active:scale-[0.99]"
                        >
                            <span className="font-medium text-sm text-foreground">{member.name}</span>
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
