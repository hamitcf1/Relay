import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { Button } from './button'

export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const scrollParentRef = useRef<HTMLElement | Window | null>(null)

    useEffect(() => {
        // Find the closest scrollable parent
        const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
            if (!element) return null
            if (element === document.body || element === document.documentElement) return document.documentElement
            const style = window.getComputedStyle(element)
            if (['auto', 'scroll'].includes(style.overflowY) || ['auto', 'scroll'].includes(style.overflow)) {
                return element
            }
            return findScrollableParent(element.parentElement)
        }

        const wrapper = wrapperRef.current
        if (!wrapper) return

        let scrollParent = findScrollableParent(wrapper.parentElement)
        if (!scrollParent) scrollParent = document.documentElement

        scrollParentRef.current = scrollParent

        const target = scrollParent === document.documentElement ? window : scrollParent

        const handleScroll = () => {
            const scrollTop = scrollParent === document.documentElement ? window.scrollY : (scrollParent as HTMLElement).scrollTop
            const scrollHeight = scrollParent.scrollHeight
            const clientHeight = scrollParent === document.documentElement ? window.innerHeight : (scrollParent as HTMLElement).clientHeight

            const maxScroll = scrollHeight - clientHeight
            // Only show if content is actually scrollable and we are past halfway
            if (maxScroll > 100 && scrollTop > maxScroll / 2) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        target.addEventListener('scroll', handleScroll, { passive: true })
        // Check initially
        handleScroll()

        return () => {
            target.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const scrollToTop = () => {
        const target = scrollParentRef.current === document.documentElement ? window : scrollParentRef.current
        if (target) {
            target.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <div ref={wrapperRef} className="absolute bottom-4 right-4 z-[60] pointer-events-none sticky float-right">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="pointer-events-auto"
                    >
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full shadow-lg border border-white/10 bg-indigo-500/80 backdrop-blur hover:bg-indigo-600/90 text-white"
                            onClick={scrollToTop}
                        >
                            <ArrowUp className="w-5 h-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
