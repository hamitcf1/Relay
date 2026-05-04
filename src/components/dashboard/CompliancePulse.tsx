import { motion } from 'framer-motion'
import { Check, ShieldCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
                                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-500" />
                            ) : (
                                <span className="text-[10px] font-black tabular-nums">
                                    {checked}/{total}
                                </span>
                            )}
                        </div>

                        {/* Pulsing Aura if incomplete */}
                        {percentage < 100 && (
                            <div className={cn(
                                "absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none",
                                percentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                            )} />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 bg-card border-border shadow-2xl z-[100]">
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Compliance Pulse</h4>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-medium text-muted-foreground">KBS System Check</span>
                                {kbsChecked ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-medium text-muted-foreground">Agency Messages</span>
                                {agencyChecked ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                )}
                            </div>
                        </div>
                        <div className="pt-1 border-t border-border/50">
                            <p className="text-[9px] text-muted-foreground leading-tight italic">
                                {percentage === 100 
                                    ? "Operations compliant." 
                                    : "Checks pending for current shift."}
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
