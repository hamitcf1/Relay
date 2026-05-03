import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordRevealProps {
    value: string
    visible: boolean
}

export function PasswordReveal({ value, visible }: PasswordRevealProps) {
    return (
        <div className="h-full flex items-center whitespace-nowrap overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
                {value.split('').map((char, i) => (
                    <motion.span
                        key={`${i}-${char}-${visible}`}
                        initial={{ y: 15, opacity: 0, filter: 'blur(4px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ y: -15, opacity: 0, filter: 'blur(4px)' }}
                        transition={{
                            delay: i * 0.02,
                            duration: 0.15,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="inline-block"
                    >
                        {visible ? (char === ' ' ? '\u00A0' : char) : '•'}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    )
}
