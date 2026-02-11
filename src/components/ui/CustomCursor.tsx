import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false)
    const [isTextInput, setIsTextInput] = useState(false)
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    // "stiffness" determines how fast it catches up (higher = faster/less laggy)
    // "damping" determines how much it resists oscillation (higher = less bouncy)
    const springConfig = { damping: 50, stiffness: 1000 }
    const cursorXSpring = useSpring(cursorX, springConfig)
    const cursorYSpring = useSpring(cursorY, springConfig)

    const [isHidden, setIsHidden] = useState(false)

    useEffect(() => {
        const updateCursorState = (e: MouseEvent) => {
            // Update position
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)

            // Check if on scrollbar (right or bottom edge)
            const isOnVerticalScrollbar = e.clientX > document.documentElement.clientWidth
            const isOnHorizontalScrollbar = e.clientY > document.documentElement.clientHeight

            if (isOnVerticalScrollbar || isOnHorizontalScrollbar) {
                setIsHidden(true)
                return
            } else {
                setIsHidden(false)
            }

            // Target detection checks
            const target = e.target as HTMLElement

            // Check computed style for cursor pointer
            const style = window.getComputedStyle(target)
            const isPointer = style.cursor === 'pointer'

            const isClickable =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('cursor-pointer') ||
                isPointer

            const isInput = target.tagName === 'INPUT'
            const inputType = isInput ? (target as HTMLInputElement).type : ''
            const isTextArea = target.tagName === 'TEXTAREA'
            const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true'

            // Exclude non-text inputs from being treated as text
            const isText =
                isTextArea ||
                isContentEditable ||
                (isInput &&
                    !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'hidden'].includes(inputType)
                )

            setIsHovering(!!isClickable)
            setIsTextInput(!!isText)
        }

        const handleMouseLeave = () => {
            setIsHidden(true)
        }

        const handleMouseEnter = () => {
            setIsHidden(false)
        }

        window.addEventListener('mousemove', updateCursorState)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseenter', handleMouseEnter)

        return () => {
            window.removeEventListener('mousemove', updateCursorState)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseenter', handleMouseEnter)
        }
    }, [cursorX, cursorY])

    // Hide cursor on touch devices to prevent weird artifacts
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null
    }

    return (
        <motion.div
            className={cn(
                "fixed top-0 left-0 rounded-full pointer-events-none z-[9999] mix-blend-difference",
                "border border-white flex items-center justify-center transition-opacity duration-300",
                isTextInput ? "w-1 h-6 rounded-none border-none bg-white" : "w-8 h-8 rounded-full",
                isHidden ? "opacity-0" : "opacity-100"
            )}
            style={{
                translateX: cursorXSpring,
                translateY: cursorYSpring,
                x: '-50%',
                y: '-50%'
            }}
            animate={{
                width: isTextInput ? 2 : 32,
                height: isTextInput ? 24 : 32,
                borderRadius: isTextInput ? 0 : 16, // 16px radius for 32px width = Circle
                backgroundColor: isHovering && !isTextInput ? 'rgba(255, 255, 255, 1)' : (isTextInput ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0)'),
                scale: isHovering && !isTextInput ? 1.5 : 1,
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
            }}
        >
            <motion.div
                className="w-1 h-1 bg-white rounded-full"
                animate={{
                    scale: isHovering && !isTextInput ? 0 : (isTextInput ? 0 : 1)
                }}
            />
        </motion.div>
    )
}
