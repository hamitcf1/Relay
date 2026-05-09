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
}

type SecurityStore = SecurityState & SecurityActions

let countdownInterval: NodeJS.Timeout | null = null

export const useSecurityStore = create<SecurityStore>((set, get) => ({
    countdown: null,
    showOverlay: false,
    lastTriggerReason: null,

    setCountdown: (val) => set({ countdown: val }),
    setShowOverlay: (val) => set({ showOverlay: val }),
    
    startCountdown: (seconds, reason) => {
        if (countdownInterval) clearInterval(countdownInterval)
        
        set({ countdown: seconds, lastTriggerReason: reason })
        if (reason === 'manual' || reason === 'shift_end') {
            set({ showOverlay: true })
        }

        countdownInterval = setInterval(() => {
            const { countdown } = get()
            if (countdown !== null && countdown > 0) {
                set({ countdown: countdown - 1 })
            } else if (countdown === 0) {
                if (countdownInterval) clearInterval(countdownInterval)
                // Trigger auto logout via window event or direct auth call if possible
                // For now, we'll let components listen to countdown === 0
            }
        }, 1000)
    },

    stopCountdown: () => {
        if (countdownInterval) clearInterval(countdownInterval)
        set({ countdown: null, showOverlay: false, lastTriggerReason: null })
    },
}))
