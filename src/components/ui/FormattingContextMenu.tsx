import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { List } from 'lucide-react'
import { type FormattingMenuState } from '@/hooks/useFormatting'

interface FormattingContextMenuProps {
    state: FormattingMenuState
    onClose: () => void
    onToggleBullet: () => void
    t: (key: any) => string
}

export function FormattingContextMenu({ state, onClose, onToggleBullet, t }: FormattingContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        if (state.show) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [state.show, onClose])

    if (!state.show) return null

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
            style={{ top: state.y, left: state.x }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleBullet()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-primary/20 hover:text-primary transition-colors text-left"
            >
                <List className="w-3.5 h-3.5" />
                {t('common.formatting.bulletList') || 'Bullet List'}
            </button>
        </div>,
        document.body
    )
}
