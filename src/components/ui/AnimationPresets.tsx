import { motion } from 'framer-motion'
import type { ReactNode, HTMLAttributes } from 'react'

interface AnimationProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    delay?: number
    duration?: number
    className?: string
    /** If true, disables the transform reset optimization (use for elements that need ongoing transforms) */
    keepTransform?: boolean
}

/**
 * Fade in from below. Most common entrance animation.
 */
export function FadeIn({ children, delay = 0, duration = 0.4, className = '', keepTransform = false, ...props }: AnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, ...(keepTransform ? {} : { transitionEnd: { transform: "none" } }) }}
            transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1.0] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * Slide in from the left.
 */
export function SlideInLeft({ children, delay = 0, duration = 0.4, className = '', keepTransform = false, ...props }: AnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, ...(keepTransform ? {} : { transitionEnd: { transform: "none" } }) }}
            transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1.0] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * Slide in from the right.
 */
export function SlideInRight({ children, delay = 0, duration = 0.4, className = '', keepTransform = false, ...props }: AnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, ...(keepTransform ? {} : { transitionEnd: { transform: "none" } }) }}
            transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1.0] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * Scale in from slightly smaller. Good for cards and modals.
 */
export function ScaleIn({ children, delay = 0, duration = 0.3, className = '', keepTransform = false, ...props }: AnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, ...(keepTransform ? {} : { transitionEnd: { transform: "none" } }) }}
            transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1.0] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * Stagger container for orchestrating child entrance animations.
 * Wrap a list of items and each child animates in sequence.
 * 
 * Children should use `motion.div` with the `item` variant:
 * ```tsx
 * <StaggerContainer>
 *   <motion.div variants={staggerItem}>...</motion.div>
 * </StaggerContainer>
 * ```
 */
export function StaggerContainer({ children, staggerDelay = 0.05, className = '', ...props }: AnimationProps & { staggerDelay?: number }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: staggerDelay }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/**
 * Pre-built stagger item variants for use with StaggerContainer.
 */
export const staggerItem = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }
    }
}
