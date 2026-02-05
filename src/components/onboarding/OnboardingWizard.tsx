import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    ChevronRight,
    ChevronLeft,
    Layout,
    Activity,
    ShieldCheck,
    Calendar,
    Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Step {
    title: string
    description: string
    icon: any
    color: string
}

export function OnboardingWizard() {
    // const { t } = useLanguageStore() // t is currently unused, uncomment when needed
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('relay_onboarding_seen')
        if (!hasSeenOnboarding) {
            setIsOpen(true)
        }
    }, [])

    const steps: Step[] = [
        {
            title: "Welcome to Relay",
            description: "Your digital hotel operations hub. Let's take a quick look around.",
            icon: Layout,
            color: "text-indigo-400"
        },
        {
            title: "Live Activity Feed",
            description: "The left column shows all guest requests and maintenance logs in real-time.",
            icon: Activity,
            color: "text-emerald-400"
        },
        {
            title: "Shift Operations",
            description: "The center column tracks your active shift, cash, and compliance checklists.",
            icon: ShieldCheck,
            color: "text-amber-400"
        },
        {
            title: "Team & Schedule",
            description: "The right column manages the roster, calendar, and general hotel info.",
            icon: Calendar,
            color: "text-purple-400"
        },
        {
            title: "Localization",
            description: "Use the globe icon in the header to switch between Turkish and English anytime.",
            icon: Globe,
            color: "text-blue-400"
        }
    ]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1)
        } else {
            handleComplete()
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1)
        }
    }

    const handleComplete = () => {
        localStorage.setItem('relay_onboarding_seen', 'true')
        setIsOpen(false)
    }

    if (!isOpen) return null

    const step = steps[currentStep]
    const Icon = step.icon

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm glass rounded-3xl overflow-hidden shadow-2xl border-white/10"
            >
                {/* Progress Bar */}
                <div className="flex h-1 bg-white/5">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`}
                        />
                    ))}
                </div>

                <div className="p-8 text-center space-y-6">
                    <button
                        onClick={handleComplete}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className={`w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10 ${step.color}`}>
                            <Icon className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">{step.title}</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    </motion.div>

                    <div className="flex items-center justify-between pt-4">
                        <Button
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>

                        <Button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                        >
                            {currentStep === steps.length - 1 ? "Finish" : "Next"}
                            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
