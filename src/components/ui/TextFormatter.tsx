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
                        {line}
                    </p>
                )
            }
        }
    })

    flushList(lines.length)

    return <div className={cn("whitespace-pre-wrap break-words", className)}>{elements}</div>
}
