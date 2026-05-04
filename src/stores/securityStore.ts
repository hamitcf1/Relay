import { create } from 'zustand'

interface SecurityState {
    countdown: number | null
    showOverlay: boolean
    lastTriggerReason: 'shift_end' | 'manual' | 'idle' | null
}

interface SecurityActions {
    setCountdown: (val: number | null) => void
    setShowOverlay: (val: boolean) => void
    startCountdown: (seconds: number, reason: 'shift_end' | 'manual' | 'idle') => void
    stopCountdown: () => void
    triggerManualCheck: () => void
}

type SecurityStore = SecurityState & SecurityActions

export const useSecurityStore = create<SecurityStore>((set) => ({
    countdown: null,
    showOverlay: false,
    lastTriggerReason: null,

    setCountdown: (val) => set({ countdown: val }),
    setShowOverlay: (val) => set({ showOverlay: val }),
    
    startCountdown: (seconds, reason) => {
        set({ countdown: seconds, lastTriggerReason: reason })
        // If manual, show overlay immediately
        if (reason === 'manual') {
            set({ showOverlay: true })
        }
    },

    stopCountdown: () => set({ countdown: null, showOverlay: false, lastTriggerReason: null }),

    triggerManualCheck: () => {
        set({ countdown: 60, showOverlay: true, lastTriggerReason: 'manual' })
    }
}))
