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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[120px] transition-all"
                    placeholder="..."
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    onClick={() => onSave(menu)}
                    disabled={loading}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {t('common.save')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    size="sm"
                    className="text-zinc-400 hover:text-white"
                >
                    <X className="w-4 h-4 mr-2" />
                    {t('common.cancel')}
                </Button>
            </div>
        </div>
    )
}
