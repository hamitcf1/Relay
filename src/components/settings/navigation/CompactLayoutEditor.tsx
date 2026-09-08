import { ArrowLeftRight, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import type { CompactLayout } from '@/types'
import type { ModuleId } from '@/config/moduleRegistry'
import { findModule, getModuleLabel } from '@/lib/navigation'
import { normalizeCompactLayout } from '@/lib/workspace'

interface CompactLayoutEditorProps {
    layout?: CompactLayout
    language: 'tr' | 'en' | 'ru'
    onMove: (moduleId: string, column: 'left' | 'right', index: number) => void
}

export function CompactLayoutEditor({ layout, language, onMove }: CompactLayoutEditorProps) {
    const normalized = normalizeCompactLayout(layout)
    const copy = language === 'tr'
        ? { title: 'Kompakt görünüm düzeni', desc: 'Vardiya kartlarını iki sütun arasında taşıyın ve sıralayın.', left: 'Sol sütun', right: 'Sağ sütun', up: 'yukarı taşı', down: 'aşağı taşı', toLeft: 'sol sütuna taşı', toRight: 'sağ sütuna taşı' }
        : language === 'ru'
            ? { title: 'Компактная компоновка', desc: 'Перемещайте и сортируйте карточки смены.', left: 'Левая колонка', right: 'Правая колонка', up: 'переместить вверх', down: 'переместить вниз', toLeft: 'переместить в левую колонку', toRight: 'переместить в правую колонку' }
            : { title: 'Compact workspace layout', desc: 'Move and order Shift cards across two columns.', left: 'Left column', right: 'Right column', up: 'move up', down: 'move down', toLeft: 'move to left column', toRight: 'move to right column' }

    return (
        <section data-testid="compact-layout-editor" className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">{copy.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{copy.desc}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {(['left', 'right'] as const).map((column) => (
                    <div key={column} className="rounded-xl border border-border/70 bg-background p-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onMove(event.dataTransfer.getData('text/compact-module-id'), column, normalized[column].length)}>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">{copy[column]}</p>
                        <div className="space-y-2">
                            {normalized[column].map((id, index) => {
                                const module = findModule(id as ModuleId)
                                if (!module) return null
                                const label = getModuleLabel(module, language)
                                const other = column === 'left' ? 'right' : 'left'
                                return <div key={id} draggable onDragStart={(event) => event.dataTransfer.setData('text/compact-module-id', id)} onDrop={(event) => { event.stopPropagation(); onMove(event.dataTransfer.getData('text/compact-module-id'), column, index) }} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                                    <button aria-label={`${label}: ${copy.up}`} disabled={index === 0} onClick={() => onMove(id, column, index - 1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted disabled:opacity-25"><ChevronUp className="h-3.5 w-3.5" /></button>
                                    <button aria-label={`${label}: ${copy.down}`} disabled={index === normalized[column].length - 1} onClick={() => onMove(id, column, index + 1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted disabled:opacity-25"><ChevronDown className="h-3.5 w-3.5" /></button>
                                    <button aria-label={`${label}: ${column === 'left' ? copy.toRight : copy.toLeft}`} onClick={() => onMove(id, other, normalized[other].length)} className="grid h-8 w-8 place-items-center rounded-md text-primary hover:bg-primary/10"><ArrowLeftRight className="h-3.5 w-3.5" /></button>
                                </div>
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
