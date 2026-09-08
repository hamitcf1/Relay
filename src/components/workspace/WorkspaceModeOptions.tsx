import { useState } from 'react'
import { LayoutGrid, PanelTop } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { WorkspaceMode } from '@/types'
import { cn } from '@/lib/utils'
import { useWorkspaceEditStore } from '@/stores/workspaceEditStore'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { normalizeWorkspaceMode } from '@/lib/workspace'

export function WorkspaceModeOptions() {
    const user = useAuthStore((state) => state.user)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const { language } = useLanguageStore()
    const mode = normalizeWorkspaceMode(user?.settings?.workspace_mode)
    const dirtyIds = useWorkspaceEditStore((state) => state.dirtyIds)
    const [pendingMode, setPendingMode] = useState<WorkspaceMode | null>(null)
    const copy = language === 'tr'
        ? { title: 'Çalışma alanı', modern: 'Modern', modernDesc: 'Modüller ayrı sayfalarda', compact: 'Kompakt', compactDesc: 'Vardiya kartları bir arada', error: 'Görünüm kaydedilemedi', warning: 'Kaydedilmemiş değişiklikler var', warningDesc: 'Görünümü değiştirirseniz açık formdaki değişiklikler silinecek.', stay: 'Kal ve düzenlemeye devam et', discard: 'Değişiklikleri sil ve geç' }
        : language === 'ru'
            ? { title: 'Рабочее пространство', modern: 'Современный', modernDesc: 'Модули на отдельных страницах', compact: 'Компактный', compactDesc: 'Карточки смены вместе', error: 'Не удалось сохранить вид', warning: 'Есть несохранённые изменения', warningDesc: 'При смене вида данные открытой формы будут удалены.', stay: 'Остаться и продолжить', discard: 'Удалить и переключить' }
            : { title: 'Workspace', modern: 'Modern', modernDesc: 'Modules on separate pages', compact: 'Compact', compactDesc: 'Shift cards together', error: 'Could not save workspace', warning: 'You have unsaved changes', warningDesc: 'Changing workspace will discard the open form.', stay: 'Stay and continue editing', discard: 'Discard changes and switch' }

    const choose = async (next: WorkspaceMode) => {
        if (next === mode) return
        if (dirtyIds.length) {
            setPendingMode(next)
            return
        }
        await save(next)
    }

    const save = async (next: WorkspaceMode) => {
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
            <AlertDialog open={Boolean(pendingMode)} onOpenChange={(open) => { if (!open) setPendingMode(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{copy.warning}</AlertDialogTitle><AlertDialogDescription>{copy.warningDesc}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingMode(null)}>{copy.stay}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { const next = pendingMode; setPendingMode(null); if (next) void save(next) }}>{copy.discard}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
