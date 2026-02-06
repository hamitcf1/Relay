import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

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

const steps: Step[] = [
    {
        target: 'tour-start', // We need to add IDs to these elements
        title: 'Welcome to Relay',
        content: 'This is your digital handover platform. Let\'s take a quick tour.',
        position: 'bottom'
    },
    {
        target: 'tour-shift-start',
        title: 'Shift Start',
        content: 'Begin your shift here. Log your cash, keys, and important notes depending on your role.',
        position: 'right'
    },
    {
        target: 'tour-sales',
        title: 'Sales & Operations',
        content: 'Track tours, transfers, and laundry sales. You can now update statuses directly from the list!',
        position: 'right'
    },
    {
        target: 'tour-logs',
        title: 'Logs & Issues',
        content: 'Report maintenance issues or general logs differently. Issues are tracked until resolved.',
        position: 'right'
    },
    {
        target: 'tour-notifications',
        title: 'Notifications',
        content: 'Stay updated on off-day requests and important messages. You can now dismiss them!',
        position: 'bottom'
    },
    {
        target: 'tour-profile',
        title: 'Your Profile',
        content: 'Access settings, tutorials, and logout here.',
        position: 'left'
    }
]

export function TourOverlay({ isOpen, onClose }: TourOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0)
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
