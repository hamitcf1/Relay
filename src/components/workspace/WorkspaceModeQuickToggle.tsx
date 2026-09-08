import { useState } from 'react'
import { LayoutGrid, PanelTop } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useWorkspaceEditStore } from '@/stores/workspaceEditStore'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { WorkspaceMode } from '@/types'
import { normalizeWorkspaceMode } from '@/lib/workspace'

export function WorkspaceModeQuickToggle() {
    const user = useAuthStore((state) => state.user)
    const updateSettings = useAuthStore((state) => state.updateSettings)
    const dirtyIds = useWorkspaceEditStore((state) => state.dirtyIds)
    const clearDirty = useWorkspaceEditStore((state) => state.clear)
    const { language } = useLanguageStore()
    const current = normalizeWorkspaceMode(user?.settings?.workspace_mode)
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const next: WorkspaceMode = current === 'modern' ? 'compact' : 'modern'
    const copy = language === 'tr'
        ? { compact: 'Kompakt görünüme geç', modern: 'Modern görünüme geç', warning: 'Kaydedilmemiş değişiklikler var', warningDesc: 'Görünümü değiştirirseniz açık formdaki değişiklikler silinecek.', stay: 'Kal ve düzenlemeye devam et', discard: 'Değişiklikleri sil ve geç', error: 'Görünüm kaydedilemedi' }
        : language === 'ru'
            ? { compact: 'Перейти к компактному виду', modern: 'Перейти к современному виду', warning: 'Есть несохранённые изменения', warningDesc: 'При смене вида данные открытой формы будут удалены.', stay: 'Остаться и продолжить', discard: 'Удалить и переключить', error: 'Не удалось сохранить вид' }
            : { compact: 'Switch to Compact', modern: 'Switch to Modern', warning: 'You have unsaved changes', warningDesc: 'Changing workspace will discard the open form.', stay: 'Stay and continue editing', discard: 'Discard changes and switch', error: 'Could not save workspace' }
    const label = next === 'compact' ? copy.compact : copy.modern
    const Icon = next === 'compact' ? PanelTop : LayoutGrid
    const save = async () => {
        try {
            await updateSettings({ workspace_mode: next })
        } catch {
            toast.error(copy.error)
        }
    }

    return (
        <>
            <DropdownMenuItem
                aria-label={label}
                onSelect={(event) => {
                    if (dirtyIds.length) {
                        event.preventDefault()
                        setConfirmationOpen(true)
                    }
                    else void save()
                }}
                className="gap-2 cursor-pointer text-sm"
            >
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {label}
            </DropdownMenuItem>
            <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{copy.warning}</AlertDialogTitle><AlertDialogDescription>{copy.warningDesc}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{copy.stay}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { clearDirty(); void save() }}>{copy.discard}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
