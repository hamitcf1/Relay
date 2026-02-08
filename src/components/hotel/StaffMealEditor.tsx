import { useState } from 'react'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/stores/languageStore'

interface StaffMealEditorProps {
    defaultValue: string
    onSave: (menu: string) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export function StaffMealEditor({
    defaultValue,
    onSave,
    onCancel,
    loading
}: StaffMealEditorProps) {
    const { t } = useLanguageStore()
    const [menu, setMenu] = useState(defaultValue)

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1.5">
                    {t('menu.content')}
                </label>
                <textarea
                    value={menu}
                    onChange={(e) => setMenu(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] transition-all"
                    placeholder="..."
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    onClick={() => onSave(menu)}
                    disabled={loading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {t('common.save')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4 mr-2" />
                    {t('common.cancel')}
                </Button>
            </div>
        </div>
    )
}
