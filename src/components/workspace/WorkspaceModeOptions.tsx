import { LayoutGrid, PanelTop } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { WorkspaceMode } from '@/types'
import { cn } from '@/lib/utils'

export function WorkspaceModeOptions() {
    const user = useAuthStore((state) => state.user)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const { language } = useLanguageStore()
    const mode = user?.settings?.workspace_mode || 'modern'
    const copy = language === 'tr'
        ? { title: 'Çalışma alanı', modern: 'Modern', modernDesc: 'Modüller ayrı sayfalarda', compact: 'Kompakt', compactDesc: 'Vardiya kartları bir arada', error: 'Görünüm kaydedilemedi' }
        : language === 'ru'
            ? { title: 'Рабочее пространство', modern: 'Современный', modernDesc: 'Модули на отдельных страницах', compact: 'Компактный', compactDesc: 'Карточки смены вместе', error: 'Не удалось сохранить вид' }
            : { title: 'Workspace', modern: 'Modern', modernDesc: 'Modules on separate pages', compact: 'Compact', compactDesc: 'Shift cards together', error: 'Could not save workspace' }

    const choose = async (next: WorkspaceMode) => {
        try {
            await updateSettings({ workspace_mode: next })
        } catch {
            toast.error(copy.error)
        }
    }

    return (
        <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.title}</p>
            <div className="grid grid-cols-2 gap-2" data-testid="workspace-mode-options">
                {([
                    { id: 'modern' as const, icon: LayoutGrid, label: copy.modern, desc: copy.modernDesc },
                    { id: 'compact' as const, icon: PanelTop, label: copy.compact, desc: copy.compactDesc },
                ]).map(({ id, icon: Icon, label, desc }) => (
                    <button key={id} onClick={() => void choose(id)} aria-pressed={mode === id} className={cn('rounded-xl border p-3 text-left transition-colors', mode === id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted')}>
                        <Icon className="mb-3 h-5 w-5" />
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{desc}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
