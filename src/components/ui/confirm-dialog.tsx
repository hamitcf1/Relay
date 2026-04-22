import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'destructive' | 'default'
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
    const ctx = useContext(ConfirmContext)
    if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
    return ctx.confirm
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        open: boolean
        options: ConfirmOptions
        resolve: ((value: boolean) => void) | null
    }>({
        open: false,
        options: { title: '' },
        resolve: null,
    })

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setState({ open: true, options, resolve })
        })
    }, [])

    const handleConfirm = () => {
        state.resolve?.(true)
        setState({ open: false, options: { title: '' }, resolve: null })
    }

    const handleCancel = () => {
        state.resolve?.(false)
        setState({ open: false, options: { title: '' }, resolve: null })
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            {state.options.variant === 'destructive' && (
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                            )}
                            <div>
                                <AlertDialogTitle>{state.options.title}</AlertDialogTitle>
                                {state.options.description && (
                                    <AlertDialogDescription className="mt-1">
                                        {state.options.description}
                                    </AlertDialogDescription>
                                )}
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{state.options.cancelLabel || 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            {state.options.confirmLabel || 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    )
}
