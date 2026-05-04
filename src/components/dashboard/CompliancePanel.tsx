import { Check, ShieldAlert, ShieldCheck, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShiftStore } from '@/stores/shiftStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CompliancePanelProps {
    hotelId: string
    className?: string
}

export function CompliancePanel({ hotelId, className }: CompliancePanelProps) {
    const { currentShift, updateCompliance } = useShiftStore()
    const { t } = useLanguageStore()

    if (!currentShift) return null

    const kbsChecked = currentShift.compliance.kbs_checked
    const agencyChecked = currentShift.compliance.agency_msg_checked_count > 0

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">
                    {t('compliance.title') || 'Compliance Checklist'}
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                        <div className={cn(
                            "w-2 h-2 rounded-full border border-background",
                            kbsChecked ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        )} />
                        <div className={cn(
                            "w-2 h-2 rounded-full border border-background",
                            agencyChecked ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        )} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {/* KBS Check */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                        kbsChecked 
                            ? "bg-emerald-500/5 border-emerald-500/20" 
                            : "bg-rose-500/5 border-rose-500/20"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl",
                            kbsChecked ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        )}>
                            {kbsChecked ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-bold">{t('compliance.kbs') || 'KBS System'}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {kbsChecked ? (t('compliance.kbsDone') || 'Identity reporting complete') : (t('compliance.kbsPending') || 'Check pending for this shift')}
                            </p>
                        </div>
                    </div>
                    
                    <Button
                        size="sm"
                        variant={kbsChecked ? "ghost" : "default"}
                        className={cn(
                            "h-8 rounded-xl font-bold text-[10px] uppercase tracking-tighter",
                            !kbsChecked && "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                        )}
                        onClick={() => updateCompliance(hotelId, 'kbs_checked', !kbsChecked)}
                    >
                        {kbsChecked ? (
                            <><Check className="w-3 h-3 mr-1" /> {t('common.done') || 'Done'}</>
                        ) : (
                            t('compliance.markDone') || 'Mark Done'
                        )}
                    </Button>
                </motion.div>

                {/* Agency Messages Check */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                        agencyChecked 
                            ? "bg-emerald-500/5 border-emerald-500/20" 
                            : "bg-rose-500/5 border-rose-500/20"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl",
                            agencyChecked ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        )}>
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{t('compliance.agency') || 'Agency Messages'}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {agencyChecked 
                                    ? (t('compliance.agencyDone', { count: String(currentShift.compliance.agency_msg_checked_count) }) || `${currentShift.compliance.agency_msg_checked_count} messages checked`) 
                                    : (t('compliance.agencyPending') || 'Check for new messages')}
                            </p>
                        </div>
                    </div>
                    
                    <Button
                        size="sm"
                        variant={agencyChecked ? "ghost" : "default"}
                        className={cn(
                            "h-8 rounded-xl font-bold text-[10px] uppercase tracking-tighter",
                            !agencyChecked && "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                        )}
                        onClick={() => updateCompliance(hotelId, 'agency_msg_checked_count', agencyChecked ? 0 : 1)}
                    >
                        {agencyChecked ? (
                            <><Check className="w-3 h-3 mr-1" /> {t('common.done') || 'Done'}</>
                        ) : (
                            t('compliance.markDone') || 'Mark Done'
                        )}
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
