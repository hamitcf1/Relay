export type RosterView = 'day' | 'employee' | 'matrix'

export function RosterViewSwitcher({ value, onChange, labels }: { value: RosterView; onChange: (view: RosterView) => void; labels: Record<RosterView, string> }) {
    return <div role="tablist" aria-label="Roster view" className="grid grid-cols-3 rounded-xl bg-muted/65 p-1 md:hidden">{(['day', 'employee', 'matrix'] as const).map((view) => <button key={view} role="tab" aria-selected={value === view} onClick={() => onChange(view)} className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-colors ${value === view ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{labels[view]}</button>)}</div>
}
