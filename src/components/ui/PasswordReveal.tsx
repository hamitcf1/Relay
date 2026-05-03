import { useState, useEffect } from 'react'

interface PasswordRevealProps {
    value: string
    visible: boolean
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'

function ScrambledChar({ char, visible, index }: { char: string; visible: boolean; index: number }) {
    const [displayChar, setDisplayChar] = useState(visible ? (char === ' ' ? '\u00A0' : char) : '•')

    useEffect(() => {
        if (!visible) {
            setDisplayChar('•')
            return
        }

        let iterations = 0
        const maxIterations = 5 + Math.floor(Math.random() * 5)
        const interval = setInterval(() => {
            if (iterations >= maxIterations) {
                setDisplayChar(char === ' ' ? '\u00A0' : char)
                clearInterval(interval)
                return
            }

            setDisplayChar(CHARS[Math.floor(Math.random() * CHARS.length)])
            iterations++
        }, 30 + index * 5)

        return () => clearInterval(interval)
    }, [char, visible, index])

    return (
        <span className="inline-block min-w-[0.6em] text-center font-mono">
            {displayChar}
        </span>
    )
}

export function PasswordReveal({ value, visible }: PasswordRevealProps) {
    return (
        <div className="h-full flex items-center whitespace-nowrap overflow-hidden pointer-events-none">
            {value.split('').map((char, i) => (
                <ScrambledChar 
                    key={i} 
                    char={char} 
                    visible={visible} 
                    index={i} 
                />
            ))}
        </div>
    )
}
