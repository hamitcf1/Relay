import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    CheckCircle,
    Circle,
    Mail,
    FileCheck,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ShiftCompliance } from '@/types'

interface ComplianceChecklistProps {
    compliance: ShiftCompliance
    onKBSCheck: () => Promise<void>
    onAgencyCheck: () => Promise<void>
    disabled?: boolean
}

export function ComplianceChecklist({
    compliance,
    onKBSCheck,
    onAgencyCheck,
    disabled = false
}: ComplianceChecklistProps) {
    const [loading, setLoading] = useState<'kbs' | 'agency' | null>(null)

    const handleKBSCheck = async () => {
        if (disabled || compliance.kbs_checked) return
        setLoading('kbs')
        try {
            await onKBSCheck()
        } finally {
            setLoading(null)
        }
    }

    const handleAgencyCheck = async () => {
        if (disabled) return
        setLoading('agency')
        try {
            await onAgencyCheck()
        } finally {
            setLoading(null)
        }
    }

    const checks = [
        {
            key: 'agency',
            label: 'Agency Messages Checked',
            description: 'Check all OTA messages (Booking, Expedia, etc.)',
            icon: Mail,
            checked: compliance.agency_msg_checked_count > 0,
            count: compliance.agency_msg_checked_count,
            onCheck: handleAgencyCheck,
            canRecheck: true,
        },
        {
            key: 'kbs',
            label: 'KBS System Verified',
            description: 'Daily compliance check before 23:00',
            icon: FileCheck,
            checked: compliance.kbs_checked,
            count: null,
            onCheck: handleKBSCheck,
            canRecheck: false,
        },
    ]

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Compliance Checklist
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {checks.map((check) => (
                    <motion.button
                        key={check.key}
                        onClick={check.onCheck}
                        disabled={disabled || loading !== null || (check.checked && !check.canRecheck)}
                        className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                            check.checked
                                ? 'border-emerald-500/30 bg-emerald-500/10'
                                : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50',
                            (disabled || (!check.canRecheck && check.checked)) && 'opacity-50 cursor-not-allowed'
                        )}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Icon */}
                        <div className={cn(
                            'p-2 rounded-lg',
                            check.checked ? 'bg-emerald-500/20' : 'bg-zinc-800'
                        )}>
                            {loading === check.key ? (
                                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                            ) : (
                                <check.icon className={cn(
                                    'w-4 h-4',
                                    check.checked ? 'text-emerald-400' : 'text-zinc-400'
                                )} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'text-sm font-medium',
                                    check.checked ? 'text-emerald-300' : 'text-zinc-200'
                                )}>
                                    {check.label}
                                </span>
                                {check.count !== null && check.count > 0 && (
                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                                        ×{check.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-zinc-500">{check.description}</span>
                        </div>

                        {/* Check indicator */}
                        {check.checked ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                        )}
                    </motion.button>
                ))}
            </CardContent>
        </Card>
    )
}
