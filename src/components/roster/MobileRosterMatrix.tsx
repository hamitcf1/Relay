import { cn } from '@/lib/utils'

type Staff = { uid: string; name: string }
type Day = { day: string; label: string; shortLabel: string; date: string }

export function MobileRosterMatrix({ staff, days, schedule, canEdit, onCell, getTone, staffLabel }: {
    staff: Staff[]
    days: Day[]
    schedule: Record<string, Record<string, string | null>>
    canEdit: boolean
    onCell: (uid: string, day: string) => void
    getTone: (shift: string) => string
    staffLabel: string
}) {
    return (
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border/70 md:hidden">
            <table className="w-full table-fixed text-xs">
                <thead className="bg-muted/45">
                    <tr>
                        {days.map((item) => (
                            <th key={item.day} scope="col" aria-label={`${item.label} ${item.date}`} className="min-w-0 px-0.5 py-2 text-center">
                                <span className="block text-[10px] font-semibold leading-tight">{item.shortLabel}</span>
                                <small className="block font-mono text-[9px] font-normal leading-tight text-muted-foreground">{item.date}</small>
                            </th>
                        ))}
                    </tr>
                </thead>
                {staff.map((member) => (
                    <tbody key={member.uid} className="border-t border-border/60">
                        <tr>
                            <th scope="rowgroup" colSpan={days.length} className="bg-card px-2.5 pt-2 pb-1 text-left text-xs font-medium" aria-label={`${staffLabel}: ${member.name}`}>
                                {member.name}
                            </th>
                        </tr>
                        <tr>
                            {days.map((item) => {
                                const shift = schedule[member.uid]?.[item.day] || null
                                return (
                                    <td key={item.day} className="min-w-0 p-0.5 pb-2 text-center">
                                        <button
                                            type="button"
                                            disabled={!canEdit}
                                            onClick={() => onCell(member.uid, item.day)}
                                            aria-label={`${member.name}, ${item.label} ${item.date}: ${shift || '—'}`}
                                            className={cn('h-11 w-full min-w-0 truncate rounded-md border px-0.5 text-[10px] font-semibold', shift ? getTone(shift) : 'border-border bg-muted/35 text-muted-foreground')}
                                        >
                                            {shift || '—'}
                                        </button>
                                    </td>
                                )
                            })}
                        </tr>
                    </tbody>
                ))}
            </table>
        </div>
    )
}
