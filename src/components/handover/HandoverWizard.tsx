import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    ChevronRight,
    ChevronLeft,
    ClipboardCheck,
    Wallet,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLogsStore } from '@/stores/logsStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useLanguageStore } from '@/stores/languageStore'

interface HandoverWizardProps {
    isOpen: boolean
    onClose: () => void
    hotelId: string
    onComplete: (cashEnd: number, handoverNote: string) => Promise<void>
}

type WizardStep = 'tickets' | 'cash' | 'notes' | 'confirm'

export function HandoverWizard({ isOpen, onClose, hotelId: _hotelId, onComplete }: HandoverWizardProps) {
    const { logs } = useLogsStore()
    const { currentShift } = useShiftStore()
    const { t } = useLanguageStore()

    const STEPS: WizardStep[] = ['tickets', 'cash', 'notes', 'confirm']

    const stepInfo: Record<WizardStep, { title: string; icon: React.ElementType }> = {
        tickets: { title: t('handover.step.tickets'), icon: ClipboardCheck },
        cash: { title: t('handover.step.cash'), icon: Wallet },
        notes: { title: t('handover.step.notes'), icon: MessageSquare },
        confirm: { title: t('handover.step.confirm'), icon: CheckCircle },
    }

    const [currentStep, setCurrentStep] = useState<WizardStep>('tickets')
    const [cashEnd, setCashEnd] = useState('')
    const [handoverNote, setHandoverNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [acknowledgedTickets, setAcknowledgedTickets] = useState<Set<string>>(new Set())

    // Get open tickets only
    const openTickets = logs.filter(l => l.status === 'open')

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep('tickets')
            setCashEnd('')
            setHandoverNote('')
            setAcknowledgedTickets(new Set())
        }
    }, [isOpen])

    const currentStepIndex = STEPS.indexOf(currentStep)
    const isFirstStep = currentStepIndex === 0
    const isLastStep = currentStepIndex === STEPS.length - 1

    const canProceed = () => {
        switch (currentStep) {
            case 'tickets':
                // All open tickets must be acknowledged
                return openTickets.length === 0 || acknowledgedTickets.size === openTickets.length
            case 'cash':
                return cashEnd.trim() !== '' && !isNaN(parseFloat(cashEnd))
            case 'notes':
                return true // Notes are optional
            case 'confirm':
                return true
            default:
                return false
        }
    }

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentStepIndex + 1])
        }
    }

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(STEPS[currentStepIndex - 1])
        }
    }

    const handleComplete = async () => {
        setLoading(true)
        try {
            await onComplete(parseFloat(cashEnd), handoverNote)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const toggleAcknowledge = (ticketId: string) => {
        setAcknowledgedTickets((prev) => {
            const next = new Set(prev)
            if (next.has(ticketId)) {
                next.delete(ticketId)
            } else {
                next.add(ticketId)
            }
            return next
        })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass rounded-2xl w-full max-w-2xl overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.4 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20">
                                        {(() => {
                                            const Icon = stepInfo[currentStep].icon
                                            return <Icon className="w-5 h-5 text-indigo-400" />
                                        })()}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{t('handover.wizard')}</h2>
                                        <p className="text-sm text-zinc-400">{stepInfo[currentStep].title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center gap-2 p-4 border-b border-zinc-800/50">
                                {STEPS.map((step, i) => {
                                    const isActive = i === currentStepIndex
                                    const isCompleted = i < currentStepIndex
                                    return (
                                        <div key={step} className="flex items-center flex-1">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                                isCompleted && 'bg-emerald-500 text-white',
                                                isActive && 'bg-indigo-500 text-white ring-2 ring-indigo-500/50',
                                                !isActive && !isCompleted && 'bg-zinc-800 text-zinc-500'
                                            )}>
                                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className={cn(
                                                    'flex-1 h-0.5 mx-2',
                                                    i < currentStepIndex ? 'bg-emerald-500' : 'bg-zinc-800'
                                                )} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Step Content */}
                            <div className="p-6 min-h-[300px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Step: Tickets */}
                                        {currentStep === 'tickets' && (
                                            <div className="space-y-4">
                                                {openTickets.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                                        <p className="text-zinc-300">{t('handover.noOpenTickets')}</p>
                                                        <p className="text-zinc-500 text-sm">{t('handover.allClear')}</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-zinc-400 text-sm mb-4">
                                                            {t('handover.tickets.desc')} ({acknowledgedTickets.size}/{openTickets.length})
                                                        </p>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {openTickets.map((ticket) => (
                                                                <button
                                                                    key={ticket.id}
                                                                    onClick={() => toggleAcknowledge(ticket.id)}
                                                                    className={cn(
                                                                        'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                                                                        acknowledgedTickets.has(ticket.id)
                                                                            ? 'border-emerald-500/30 bg-emerald-500/10'
                                                                            : 'border-zinc-700 hover:border-zinc-600'
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                                        acknowledgedTickets.has(ticket.id)
                                                                            ? 'border-emerald-500 bg-emerald-500'
                                                                            : 'border-zinc-600'
                                                                    )}>
                                                                        {acknowledgedTickets.has(ticket.id) && (
                                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-zinc-200 truncate">{ticket.content}</p>
                                                                        <p className="text-xs text-zinc-500 capitalize">{t(`module.${ticket.type}` as any)} • {t(`status.${ticket.urgency}` as any)}</p>
                                                                    </div>
                                                                    {ticket.urgency === 'critical' && (
                                                                        <AlertCircle className="w-4 h-4 text-rose-400" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Step: Cash */}
                                        {currentStep === 'cash' && (
                                            <div className="space-y-6">
                                                <div className="text-center">
                                                    <Wallet className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                                    <p className="text-zinc-300 mb-1">{t('handover.enterCash')}</p>
                                                    <p className="text-zinc-500 text-sm">{t('handover.countCash')}</p>
                                                </div>

                                                {currentShift && (
                                                    <div className="flex justify-center gap-8 text-sm">
                                                        <div>
                                                            <span className="text-zinc-500">{t('handover.cash.started')}:</span>
                                                            <span className="text-emerald-400 font-bold ml-2">₺{currentShift.cash_start.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="max-w-xs mx-auto">
                                                    <label className="text-sm text-zinc-400 mb-2 block">{t('handover.cashEnd')}</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={cashEnd}
                                                        onChange={(e) => setCashEnd(e.target.value)}
                                                        className="text-center text-2xl h-14"
                                                    />
                                                </div>

                                                {currentShift && cashEnd && (
                                                    <div className="text-center">
                                                        <span className="text-zinc-500">{t('handover.cash.difference')}:</span>
                                                        <span className={cn(
                                                            'font-bold ml-2',
                                                            parseFloat(cashEnd) - currentShift.cash_start >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        )}>
                                                            {parseFloat(cashEnd) - currentShift.cash_start >= 0 ? '+' : ''}
                                                            ₺{(parseFloat(cashEnd) - currentShift.cash_start).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Step: Notes */}
                                        {currentStep === 'notes' && (
                                            <div className="space-y-4">
                                                <div className="text-center mb-6">
                                                    <MessageSquare className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                                    <p className="text-zinc-300">{t('handover.step.notes')}</p>
                                                    <p className="text-zinc-500 text-sm">{t('handover.notesDesc')}</p>
                                                </div>

                                                <textarea
                                                    placeholder="e.g., Room 204 guest requested late checkout, VIP arriving tomorrow..."
                                                    value={handoverNote}
                                                    onChange={(e) => setHandoverNote(e.target.value)}
                                                    rows={6}
                                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
                                                />
                                            </div>
                                        )}

                                        {/* Step: Confirm */}
                                        {currentStep === 'confirm' && (
                                            <div className="space-y-6">
                                                <div className="text-center mb-6">
                                                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                                    <p className="text-zinc-300 text-lg font-semibold">{t('handover.readyToComplete')}</p>
                                                    <p className="text-zinc-500 text-sm">{t('handover.reviewSummary')}</p>
                                                </div>

                                                <div className="glass rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-400">{t('handover.ticketsReviewed')}</span>
                                                        <span className="text-emerald-400">{acknowledgedTickets.size}/{openTickets.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-400">{t('handover.cashEnd')}</span>
                                                        <span className="text-zinc-100 font-bold">₺{parseFloat(cashEnd || '0').toLocaleString()}</span>
                                                    </div>
                                                    {handoverNote && (
                                                        <div>
                                                            <span className="text-zinc-400 block mb-1">{t('handover.notes')}</span>
                                                            <p className="text-zinc-300 text-sm bg-zinc-800/50 p-2 rounded">{handoverNote}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-zinc-800">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={isFirstStep}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {t('common.back')}
                                </Button>

                                {isLastStep ? (
                                    <Button
                                        onClick={handleComplete}
                                        disabled={loading}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                {t('handover.complete')}
                                                <CheckCircle className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                    >
                                        {t('common.continue')}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
