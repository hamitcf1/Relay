import { useState, useCallback } from 'react'

export interface FormattingMenuState {
    show: boolean
    x: number
    y: number
}

export function useFormatting(
    _value: string,
    onChange: (val: string) => void,
    inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
) {
    const [menu, setMenu] = useState<FormattingMenuState>({ show: false, x: 0, y: 0 })

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        // Only show for text inputs, not number or other types handled elsewhere
        const target = e.target as HTMLTextAreaElement | HTMLInputElement
        if (target.type === 'number') return

        e.preventDefault()
        setMenu({
            show: true,
            x: e.clientX,
            y: e.clientY
        })
    }, [])

    const closeMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, show: false }))
    }, [])

    const toggleBullet = useCallback(() => {
        const input = inputRef.current
        if (!input) return

        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const text = input.value

        // Get the start and end of the lines affected
        const beforeSelection = text.substring(0, start)
        const lineStart = beforeSelection.lastIndexOf('\n') + 1

        const afterSelection = text.substring(end)
        const lineEndIndex = afterSelection.indexOf('\n')
        const lineEnd = lineEndIndex === -1 ? text.length : end + lineEndIndex

        const affectedText = text.substring(lineStart, lineEnd)
        const lines = affectedText.split('\n')

        // Check if all lines are already bulleted
        const allBulleted = lines.every(line => line.trim().startsWith('- '))

        let newLines: string[]
        if (allBulleted) {
            // Remove bullets
            newLines = lines.map(line => line.replace(/^(\s*)-\s?/, '$1'))
        } else {
            // Add bullets
            newLines = lines.map(line => line.trim().startsWith('- ') ? line : `- ${line}`)
        }

        const newText = text.substring(0, lineStart) + newLines.join('\n') + text.substring(lineEnd)
        onChange(newText)

        // Restore focus and selection
        setTimeout(() => {
            input.focus()
            // We don't try to be too clever with selection for now, just put cursor at the end of what was modified or keep original
            input.setSelectionRange(lineStart, lineStart + newLines.join('\n').length)
        }, 0)

        closeMenu()
    }, [onChange, inputRef, closeMenu])

    return {
        menu,
        handleContextMenu,
        closeMenu,
        toggleBullet
    }
}
