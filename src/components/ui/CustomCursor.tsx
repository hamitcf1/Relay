import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'

const CURSOR_STORAGE_KEY = 'relay_custom_cursor_enabled'

export function getCursorEnabled(): boolean {
    const saved = localStorage.getItem(CURSOR_STORAGE_KEY)
    return saved !== 'false' // default: enabled
}

export function setCursorEnabled(enabled: boolean) {
    localStorage.setItem(CURSOR_STORAGE_KEY, String(enabled))
    window.dispatchEvent(new Event('cursor-setting-changed'))
}

export function CustomCursor() {
    const [cursorEnabled, setCursorEnabledState] = useState(getCursorEnabled)

    // Listen for toggle changes from AppearanceOptions
    useEffect(() => {
        const handler = () => setCursorEnabledState(getCursorEnabled())
        window.addEventListener('cursor-setting-changed', handler)
        return () => window.removeEventListener('cursor-setting-changed', handler)
    }, [])

    // Toggle cursor visibility via class + inline style for reliability
    useEffect(() => {
        if (cursorEnabled) {
            document.body.classList.add('custom-cursor-active')
            // Clear any lingering inline cursor styles
            document.documentElement.style.cursor = ''
            document.body.style.cursor = ''
        } else {
            document.body.classList.remove('custom-cursor-active')
            // Force system cursor visible
            document.documentElement.style.cursor = 'auto'
            document.body.style.cursor = 'auto'
        }
    }, [cursorEnabled])

    if (!cursorEnabled) return null

    return <CursorRenderer />
}

function CursorRenderer() {
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    const springConfig = { damping: 50, stiffness: 1000 }
    const cursorXSpring = useSpring(cursorX, springConfig)
    const cursorYSpring = useSpring(cursorY, springConfig)

    const controls = useAnimation()
    const dotControls = useAnimation()
    const containerRef = useRef<HTMLDivElement>(null)

    const [primaryColor, setPrimaryColor] = useState('rgba(99, 102, 241, 1)')
    const stateRef = useRef({ isHovering: false, isTextInput: false, isHidden: false })

    // Resolve CSS variable --primary to a concrete color framer-motion can animate
    useEffect(() => {
        const resolvePrimary = () => {
            const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
            if (raw) {
                setPrimaryColor(`hsl(${raw})`)
            }
        }
        resolvePrimary()

        // Re-resolve when theme/accent changes
        const observer = new MutationObserver(resolvePrimary)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const updateCursorState = (e: MouseEvent) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)

            const isOnVerticalScrollbar = e.clientX > document.documentElement.clientWidth
            const isOnHorizontalScrollbar = e.clientY > document.documentElement.clientHeight
            const newIsHidden = isOnVerticalScrollbar || isOnHorizontalScrollbar

            const target = e.target as HTMLElement
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

            const isText =
                isTextArea ||
                isContentEditable ||
                (isInput &&
                    !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'hidden'].includes(inputType)
                )

            const newHover = !!isClickable
            const newText = !!isText

            // Only animate if state changes
            if (
                stateRef.current.isHovering !== newHover ||
                stateRef.current.isTextInput !== newText ||
                stateRef.current.isHidden !== newIsHidden
            ) {
                stateRef.current = { isHovering: newHover, isTextInput: newText, isHidden: newIsHidden }

                if (containerRef.current) {
                    containerRef.current.style.opacity = newIsHidden ? '0' : '1'
                }

                controls.start({
                    width: newText ? 2 : 32,
                    height: newText ? 24 : 32,
                    borderRadius: newText ? 1 : 9999,
                    backgroundColor: newHover && !newText
                        ? 'rgba(255, 255, 255, 1)'
                        : (newText ? primaryColor : 'rgba(255, 255, 255, 0)'),
                    scale: newHover && !newText ? 1.5 : 1,
                    border: newText ? 'none' : '1px solid white',
                })

                dotControls.start({
                    scale: newHover && !newText ? 0 : (newText ? 0 : 1)
                })
            }
        }

        const handleMouseLeave = () => {
            if (containerRef.current) containerRef.current.style.opacity = '0'
            stateRef.current.isHidden = true
        }
        const handleMouseEnter = () => {
            if (containerRef.current) containerRef.current.style.opacity = '1'
            stateRef.current.isHidden = false
        }

        window.addEventListener('mousemove', updateCursorState)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseenter', handleMouseEnter)

        return () => {
            window.removeEventListener('mousemove', updateCursorState)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseenter', handleMouseEnter)
        }
    }, [cursorX, cursorY, controls, dotControls, primaryColor])

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null
    }

    return (
        <motion.div
            ref={containerRef}
            className={cn(
                "fixed top-0 left-0 pointer-events-none z-[999999] mix-blend-difference",
                "flex items-center justify-center transition-opacity duration-150"
            )}
            style={{
                translateX: cursorXSpring,
                translateY: cursorYSpring,
                x: '-50%',
                y: '-50%',
            }}
            initial={{
                width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0)', border: '1px solid white'
            }}
            animate={controls}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.8,
            }}
        >
            <motion.div
                className="w-1 h-1 bg-white rounded-full"
                animate={dotControls}
                transition={{
                    type: "spring", stiffness: 500, damping: 30
                }}
            />
        </motion.div>
    )
}
