/**
 * Web Audio API Sound Effects for Aetherius Relay
 * Pure synthesized Cyber-Chimes for notifications and critical alerts.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
            audioCtx = new AudioContextClass()
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
    }
    return audioCtx
}

/**
 * Play a pleasant Cyber chime for successful sales, tasks, or updates.
 */
export function playChimeSound() {
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, now) // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1) // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2) // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3) // C6

        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.6)
    } catch {
        // Fallback silently if audio is blocked by browser policy
    }
}

/**
 * Play an urgent synth chime for critical priority alerts or urgent tickets.
 */
export function playCriticalAlertSound() {
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, now) // A5
        osc.frequency.setValueAtTime(440, now + 0.12) // A4
        osc.frequency.setValueAtTime(880, now + 0.24) // A5

        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.5)
    } catch {
        // Fallback silently
    }
}
