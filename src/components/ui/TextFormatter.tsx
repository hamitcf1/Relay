import React from 'react'
import { cn } from '@/lib/utils'

interface TextFormatterProps {
    text: string
    className?: string
}

export function TextFormatter({ text, className }: TextFormatterProps) {
    if (!text) return null

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let currentList: string[] = []

    const flushList = (key: number) => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-2 ml-2">
                    {currentList.map((item, i) => (
                        <li key={i} className="text-inherit">
                            {item}
                        </li>
                    ))}
                </ul>
            )
            currentList = []
        }
    }

    const formatText = (content: string) => {
        const parts = content.split(/(#\d+|https?:\/\/[^\s]+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('#') && !isNaN(parseInt(part.substring(1)))) {
                return (
                    <span key={i} className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-black text-[11px] border border-amber-500/20 shadow-sm mx-0.5 inline-flex items-center">
                        {part}
                    </span>
                )
            }
            if (part.startsWith('http')) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                        {part}
                    </a>
                )
            }
            return part
        })
    }

    lines.forEach((line, index) => {
        const trimmed = line.trim()
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')

        if (isBullet) {
            currentList.push(trimmed.substring(2))
        } else {
            flushList(index)
            if (trimmed === '') {
                elements.push(<div key={`empty-${index}`} className="h-2" />)
            } else {
                elements.push(
                    <p key={`p-${index}`} className="mb-2 last:mb-0">
                        {formatText(line)}
                    </p>
                )
            }
        }
    })

    // Update flushList to use formatText
    const flushListFinal = (key: number) => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-2 ml-2">
                    {currentList.map((item, i) => (
                        <li key={i} className="text-inherit">
                            {formatText(item)}
                        </li>
                    ))}
                </ul>
            )
            currentList = []
        }
    }

    flushListFinal(lines.length)

    return <div className={cn("whitespace-pre-wrap break-words", className)}>{elements}</div>
}
