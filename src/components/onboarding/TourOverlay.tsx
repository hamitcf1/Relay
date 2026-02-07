import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/stores/languageStore'

interface Step {
    target: string // ID of expectation element
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

interface TourOverlayProps {
    isOpen: boolean
    onClose: () => void
}

export function TourOverlay({ isOpen, onClose }: TourOverlayProps) {
    const { t } = useLanguageStore()
    const [currentStep, setCurrentStep] = useState(0)

    const steps: Step[] = [
        {
            target: 'tour-start',
            title: t('tour.intro.title'),
            content: t('tour.intro.desc'),
            position: 'bottom'
        },
        {
            target: 'tour-shift-start',
            title: t('tour.compliance.title'),
            content: t('tour.compliance.desc'),
            position: 'right'
        },
        {
            target: 'tour-logs',
            title: t('tour.feed.title'),
            content: t('tour.feed.desc'),
            position: 'right'
        },
        {
            target: 'tour-tours',
            title: t('tours.catalogue.title'),
            content: t('tours.catalogue.desc'),
            position: 'bottom'
        },
        {
            target: 'tour-sales',
            title: t('tour.sales.title'),
            content: t('tour.sales.desc'),
            position: 'bottom'
        },
        {
            target: 'tour-notifications',
            title: t('tour.notifications.title'),
            content: t('tour.notifications.desc'),
            position: 'bottom'
        },
        {
            target: 'tour-profile',
            title: t('tour.profile.title'),
            content: t('tour.profile.desc'),
            position: 'left'
        }
    ]
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        if (!isOpen) return

        const updateRect = () => {
            const step = steps[currentStep]
            // If it's the first welcome step (no specific target or center), we handle it differently
            if (step.target === 'tour-start') {
                setTargetRect(null)
                return
            }

            const el = document.getElementById(step.target)
            if (el) {
                setTargetRect(el.getBoundingClientRect())
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }

        updateRect()
        window.addEventListener('resize', updateRect)
        // Check periodically in case of animations
        const interval = setInterval(updateRect, 500)

        return () => {
            window.removeEventListener('resize', updateRect)
            clearInterval(interval)
        }
    }, [isOpen, currentStep])

    if (!isOpen) return null

    const step = steps[currentStep]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1)
        } else {
            onClose()
            setCurrentStep(0)
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1)
        }
    }

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop with hole */}
            <div className="absolute inset-0 bg-black/70 mix-blend-hard-light duration-300 transition-colors" />

            {/* Spotlight */}
            {targetRect && (
                <motion.div
                    layoutId="spotlight"
                    className="absolute border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] rounded-lg pointer-events-none"
                    initial={false}
                    animate={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                />
            )}

            {/* Content Card */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            // Calculate position based on target if exists
                            ...(!targetRect ? {} : {
                                position: 'absolute',
                                top: step.position === 'bottom' ? targetRect.bottom + 20 : undefined,
                                left: step.position === 'right' ? targetRect.right + 20 :
                                    step.position === 'left' ? targetRect.left - 320 : undefined,
                                right: step.position === 'left' ? undefined : undefined
                            })
                        }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-80 pointer-events-auto bg-opacity-95 backdrop-blur-xl",
                            targetRect ? "" : "relative"
                        )}
                        style={targetRect && step.position !== 'bottom' && step.position !== 'top' ? { top: Math.max(20, targetRect.top) } : {}}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                Step {currentStep + 1}/{steps.length}
                            </span>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                            {step.content}
                        </p>

                        <div className="flex justify-between items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="text-zinc-500 hover:text-zinc-300"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Prev
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleNext}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}
