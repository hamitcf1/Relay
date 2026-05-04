import { useState } from 'react'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShiftStore } from '@/stores/shiftStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { CompliancePanel } from '@/components/dashboard/CompliancePanel'
import { Clock, DollarSign, MessageSquare, LogOut, AlertCircle } from 'lucide-react'

interface ShiftManagementModalProps {
    isOpen: boolean
    onClose: () => void
    hotelId: string
}

export function ShiftManagementModal({ isOpen, onClose, hotelId }: ShiftManagementModalProps) {
    const { currentShift, endShift } = useShiftStore()
    const { t } = useLanguageStore()
    const confirm = useConfirm()
    
    const [cashEnd, setCashEnd] = useState('')
    const [note, setNote] = useState('')
    const [isEnding, setIsEnding] = useState(false)

    if (!currentShift) return null

    const handleEndShift = async () => {
        const amount = parseFloat(cashEnd)
        if (isNaN(amount)) {
            // Should probably show an error but keeping it simple for now
            return
        }

        const confirmed = await confirm({
            title: t('shift.endConfirmTitle') || 'End Current Shift?',
            description: t('shift.endConfirmDesc') || 'This will close the current shift and log all activities. Make sure your cash count is correct.',
            confirmLabel: t('shift.endAction') || 'End Shift',
            variant: 'destructive'
        })

        if (confirmed) {
            setIsEnding(true)
            try {
                await endShift(hotelId, amount, note)
                onClose()
            } catch (error) {
                console.error("Failed to end shift:", error)
            } finally {
                setIsEnding(false)
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground max-w-md p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">
                                {t('shift.management') || 'Shift Management'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {t('shift.type') || 'Shift'}: <span className="font-bold text-primary">{currentShift.type}</span> • {currentShift.date}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Compliance Section */}
                    <CompliancePanel hotelId={hotelId} />

                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> {t('shift.cashCount') || 'Final Cash Count'}
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                {t('shift.enterCash') || 'Closing Balance (Cash in Hand)'}
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors font-bold">₺</span>
                                <Input
                                    type="number"
                                    value={cashEnd}
                                    onChange={(e) => setCashEnd(e.target.value)}
                                    className="h-12 pl-10 bg-muted/30 border-border focus:border-primary/50 text-lg font-black"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-2">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                <p className="text-[10px] text-muted-foreground italic">
                                    {t('shift.startCash') || 'Shift started with'}: <span className="font-bold text-foreground">₺{currentShift.cash_start}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> {t('shift.handoverNote') || 'Handover Notes'}
                        </h3>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full min-h-[100px] rounded-xl bg-muted/30 border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            placeholder={t('shift.notePlaceholder') || 'Any important notes for the next shift?'}
                        />
                    </div>
                </div>

                <div className="p-6 pt-2 border-t border-border/50 bg-muted/10 flex flex-col gap-3">
                    <Button
                        onClick={handleEndShift}
                        disabled={!cashEnd || isEnding}
                        className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 group"
                    >
                        {isEnding ? (
                            <span className="animate-pulse">{t('common.processing') || 'Processing...'}</span>
                        ) : (
                            <>
                                <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                                {t('shift.endAction') || 'End Shift'}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full h-10 text-muted-foreground hover:text-foreground font-medium"
                    >
                        {t('common.close') || 'Keep Shift Active'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
