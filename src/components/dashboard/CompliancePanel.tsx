import { Check, ShieldAlert, ShieldCheck, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShiftStore } from '@/stores/shiftStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

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
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    {t('compliance.title')}
                </h3>
                <div className="flex items-center gap-1">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        kbsChecked ? "bg-emerald-500" : "bg-rose-500"
                    )} aria-hidden="true" />
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        agencyChecked ? "bg-emerald-500" : "bg-rose-500"
                    )} aria-hidden="true" />
                </div>
            </div>

            <div className="space-y-2">
                {/* KBS Check */}
                <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    kbsChecked
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-rose-500/5 border-rose-500/20"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            kbsChecked ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
                        )}>
                            {kbsChecked ? <ShieldCheck className="w-4 h-4" aria-hidden="true" /> : <ShieldAlert className="w-4 h-4" aria-hidden="true" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{t('compliance.kbs')}</p>
                            <p className="text-xs text-muted-foreground">
                                {kbsChecked ? t('compliance.kbsDone') : t('compliance.kbsPending')}
                            </p>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant={kbsChecked ? "ghost" : "destructive"}
                        onClick={() => updateCompliance(hotelId, 'kbs_checked', !kbsChecked)}
                    >
                        {kbsChecked ? (
                            <><Check className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.done')}</>
                        ) : (
                            t('compliance.markDone')
                        )}
                    </Button>
                </div>

                {/* Agency Messages Check */}
                <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    agencyChecked
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-rose-500/5 border-rose-500/20"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            agencyChecked ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
                        )}>
                            <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{t('compliance.agency')}</p>
                            <p className="text-xs text-muted-foreground">
                                {agencyChecked
                                    ? t('compliance.agencyDone', { count: String(currentShift.compliance.agency_msg_checked_count) })
                                    : t('compliance.agencyPending')}
                            </p>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant={agencyChecked ? "ghost" : "destructive"}
                        onClick={() => updateCompliance(hotelId, 'agency_msg_checked_count', agencyChecked ? 0 : 1)}
                    >
                        {agencyChecked ? (
                            <><Check className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.done')}</>
                        ) : (
                            t('compliance.markDone')
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
