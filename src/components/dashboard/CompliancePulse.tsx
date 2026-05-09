import { motion } from 'framer-motion'
import { Check, ShieldCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface CompliancePulseProps {
    agencyChecked: boolean
    kbsChecked: boolean
    className?: string
}

export function CompliancePulse({ agencyChecked, kbsChecked, className }: CompliancePulseProps) {
    const { t } = useLanguageStore()
    
    const total = 2
    const checked = (agencyChecked ? 1 : 0) + (kbsChecked ? 1 : 0)
    const percentage = (checked / total) * 100
    
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className={cn("relative flex items-center justify-center group cursor-help", className)}>
                        <svg className="w-12 h-12 transform -rotate-90">
                            {/* Background Ring */}
                            <circle
                                cx="24"
                                cy="24"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-muted-foreground/10"
                            />
                            {/* Progress Ring */}
                            <motion.circle
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                cx="24"
                                cy="24"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={circumference}
                                fill="transparent"
                                strokeLinecap="round"
                                className={cn(
                                    "transition-colors duration-500",
                                    percentage === 100 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-rose-500"
                                )}
                            />
                        </svg>
                        
                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {percentage === 100 ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                            ) : (
                                <span className="text-[10px] font-semibold tabular-nums">
                                    {checked}/{total}
                                </span>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 bg-card border-border shadow-md z-[100]">
                    <div className="space-y-2 min-w-[180px]">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{t('compliance.pulse.title')}</h4>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground">{t('compliance.kbs')}</span>
                                {kbsChecked ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground">{t('compliance.agency')}</span>
                                {agencyChecked ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                                )}
                            </div>
                        </div>
                        <div className="pt-1 border-t border-border/50">
                            <p className="text-xs text-muted-foreground leading-snug">
                                {percentage === 100
                                    ? t('compliance.pulse.compliant')
                                    : t('compliance.pulse.pending')}
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
