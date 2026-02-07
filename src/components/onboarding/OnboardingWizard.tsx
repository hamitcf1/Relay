import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'

interface Step {
    title: string
    description: string
    icon: any
    color: string
}

interface OnboardingWizardProps {
    forceOpen?: boolean
    onClose?: () => void
}

export function OnboardingWizard({ forceOpen, onClose }: OnboardingWizardProps) {
    const { user, updateSettings } = useAuthStore()
    const { t } = useLanguageStore()
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true)
            setCurrentStep(0)
        } else if (user && !user.settings?.onboarding_seen) {
            setIsOpen(true)
        }
    }, [user, forceOpen])

    const steps: Step[] = [
        {
            title: t('onboarding.welcome.title'),
            description: t('onboarding.welcome.desc'),
            icon: Layout,
            color: "text-indigo-400"
        },
        {
            title: t('onboarding.activity.title'),
            description: t('onboarding.activity.desc'),
            icon: Activity,
            color: "text-emerald-400"
        },
        {
            title: t('onboarding.shift.title'),
            description: t('onboarding.shift.desc'),
            icon: ShieldCheck,
            color: "text-amber-400"
        },
        {
            title: t('onboarding.team.title'),
            description: t('onboarding.team.desc'),
            icon: Calendar, // Or CreditCard if we want to emphasize sales
            color: "text-purple-400"
        },
        {
            title: t('onboarding.localization.title'),
            description: t('onboarding.localization.desc'),
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

    const handleComplete = async () => {
        if (user && !forceOpen) {
            await updateSettings({ onboarding_seen: true })
        }
        setIsOpen(false)
        if (onClose) onClose()
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
                            {t('common.back')}
                        </Button>

                        <Button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                        >
                            {currentStep === steps.length - 1 ? t('common.finish') : t('common.next')}
                            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                        {t('onboarding.stepOf')
                            .replace('{current}', (currentStep + 1).toString())
                            .replace('{total}', steps.length.toString())}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
