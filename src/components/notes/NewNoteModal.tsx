import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteForm } from './NoteForm'
import type { Hotel, StaffMember } from '@/types'

interface NewNoteModalProps {
    isOpen: boolean
    onClose: () => void
    hotelId: string
    hotel: Hotel | null
    staff: StaffMember[]
}

export function NewNoteModal({
    isOpen,
    onClose,
    hotelId,
    hotel,
    staff
}: NewNoteModalProps) {
    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
                    {/* Backdrop click */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative z-10 w-full max-w-2xl bg-card border border-primary/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.25)]">
                                    <ArrowLeftRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground tracking-tight">
                                        Yeni Vardiya Devir Kaydı
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Sonraki vardiyaya devredilecek not veya durum kaydını oluşturun
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                            <NoteForm
                                hotelId={hotelId}
                                hotel={hotel}
                                staff={staff}
                                onCancel={onClose}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
