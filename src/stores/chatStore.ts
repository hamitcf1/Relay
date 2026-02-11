import { create } from 'zustand'
import { useAIStore, type AIModelType, type AITaskType } from './aiStore'
import { useAuthStore } from './authStore'
import { useHotelStore } from './hotelStore'
import { useShiftStore } from './shiftStore'
import { useNotesStore } from './notesStore'
import { useSalesStore } from './salesStore'
import { usePricingStore } from './pricingStore'
import { useRosterStore } from './rosterStore'
import { useLogsStore } from './logsStore'
import { useRoomStore } from './roomStore'
import { useTourStore } from './tourStore'
import { useFeedbackStore } from './feedbackStore'
import { useStaffMealStore } from './staffMealStore'
import { useCurrencyStore } from './currencyStore'
import { useOffDayStore } from './offDayStore'
import type { RoomType } from '@/types'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface ChatThread {
    id: string
    title: string
    messages: ChatMessage[]
    createdAt: Date
    updatedAt: Date
}

interface ChatState {
    threads: ChatThread[]
    activeThreadId: string | null
    isOpen: boolean
    showSidebar: boolean
    loading: boolean
    selectedModel: AIModelType
    selectedTask: AITaskType
}

interface ChatActions {
    sendMessage: (text: string) => Promise<void>
    createThread: () => string
    switchThread: (threadId: string) => void
    deleteThread: (threadId: string) => void
    toggleOpen: () => void
    setOpen: (open: boolean) => void
    toggleSidebar: () => void
    setModel: (model: AIModelType) => void
    setTask: (task: AITaskType) => void
}

type ChatStore = ChatState & ChatActions

const ROOM_TYPES: RoomType[] = ['standard', 'corner', 'corner_jacuzzi', 'triple', 'teras_suite']

function buildContext(): string {
    const parts: string[] = []

    // ── AUTH ──────────────────────────────────
    const user = useAuthStore.getState().user
    if (user) {
        parts.push(`[CURRENT USER] Name: ${user.name}, Role: ${user.role}`)
    }

    // ── HOTEL ─────────────────────────────────
    const hotel = useHotelStore.getState().hotel
    if (hotel) {
        parts.push(`[HOTEL] Name: ${hotel.info?.name || 'N/A'}`)
        if (hotel.settings?.knowledge_base) {
            parts.push(`[HOTEL KNOWLEDGE BASE] ${hotel.settings.knowledge_base}`)
        }
    }

    // ── SHIFT ─────────────────────────────────
    const shift = useShiftStore.getState().currentShift
    if (shift) {
        parts.push(`[CURRENT SHIFT] Type: ${shift.type}, Status: ${shift.status}, Date: ${shift.date}, Staff: ${shift.staff_ids.length} people, Cash Start: ${shift.cash_start}`)
        if (shift.handover_note) parts.push(`Handover Note: ${shift.handover_note}`)
    } else {
        parts.push('[CURRENT SHIFT] No active shift')
    }

    // ── NOTES ─────────────────────────────────
    const notes = useNotesStore.getState().notes
    const activeNotes = notes.filter(n => n.status === 'active')
    if (activeNotes.length > 0) {
        parts.push(`[ACTIVE NOTES] ${activeNotes.length} active notes:`)
        activeNotes.slice(0, 10).forEach(n => {
            parts.push(`  - [${n.category}] ${n.content?.substring(0, 80) || ''} ${n.room_number ? `(Room ${n.room_number})` : ''} ${n.amount_due ? `Amount: ${n.amount_due} TRY` : ''}`)
        })
    }

    // ── SALES ─────────────────────────────────
    const sales = useSalesStore.getState().sales
    const today = new Date().toISOString().split('T')[0]
    const todaySales = sales.filter(s => s.date.toISOString().split('T')[0] === today)
    const pendingSales = sales.filter(s => s.payment_status !== 'paid')
    parts.push(`[SALES] Total: ${sales.length}, Today: ${todaySales.length}, Pending Payment: ${pendingSales.length}`)
    if (todaySales.length > 0) {
        todaySales.slice(0, 5).forEach(s => {
            parts.push(`  - ${s.type}: ${s.name} - ${s.customer_name} (Room ${s.room_number}) ${s.total_price} ${s.currency}, Status: ${s.payment_status}`)
        })
    }

    // ── PRICING ───────────────────────────────
    const { basePrices, baseOverrides, agencies } = usePricingStore.getState()
    if (basePrices?.prices) {
        const priceLines = ROOM_TYPES
            .filter(r => basePrices.prices[r])
            .map(r => `${r}: ${basePrices.prices[r]!.amount} ${basePrices.prices[r]!.currency}`)
        if (priceLines.length > 0) {
            parts.push(`[BASE PRICES] ${priceLines.join(', ')}`)
        }
    }
    if (baseOverrides.length > 0) {
        parts.push(`[PRICE OVERRIDES] ${baseOverrides.length} active period overrides`)
        baseOverrides.slice(0, 3).forEach(o => {
            const rooms = Object.entries(o.prices).map(([r, p]) => `${r}: ${p.amount} ${p.currency}`).join(', ')
            parts.push(`  - ${o.start_date} to ${o.end_date}: ${rooms}`)
        })
    }
    if (agencies.length > 0) {
        parts.push(`[AGENCIES] ${agencies.map(a => a.name).join(', ')}`)
    }

    // ── ROSTER ────────────────────────────────
    const roster = useRosterStore.getState()
    if (roster.staff.length > 0) {
        parts.push(`[ROSTER] ${roster.staff.length} staff members`)
        const todayDate = new Date()
        const todayShifts = roster.getShiftsForDate(todayDate)
        if (todayShifts.length > 0) {
            parts.push(`Today's shifts: ${todayShifts.map(s => `${s.name} (${s.shift})`).join(', ')}`)
        }
    }

    // ── LOGS / TICKETS ────────────────────────
    const logs = useLogsStore.getState().logs
    if (logs.length > 0) {
        const openLogs = logs.filter(l => l.status === 'open')
        const resolvedLogs = logs.filter(l => l.status === 'resolved')
        parts.push(`[LOGS/TICKETS] Total: ${logs.length}, Open: ${openLogs.length}, Resolved: ${resolvedLogs.length}`)
        openLogs.slice(0, 8).forEach(l => {
            parts.push(`  - [${l.type}/${l.urgency}] ${l.content?.substring(0, 80) || ''} ${l.room_number ? `(Room ${l.room_number})` : ''} by ${l.created_by_name}`)
        })
    }

    // ── ROOMS ─────────────────────────────────
    const rooms = useRoomStore.getState().rooms
    if (rooms.length > 0) {
        const occupied = rooms.filter(r => r.occupancy === 'occupied').length
        const vacant = rooms.filter(r => r.occupancy === 'vacant').length
        const dirty = rooms.filter(r => r.status === 'dirty').length
        const clean = rooms.filter(r => r.status === 'clean').length
        const inspect = rooms.filter(r => r.status === 'inspect').length
        parts.push(`[ROOMS] Total: ${rooms.length}, Occupied: ${occupied}, Vacant: ${vacant}, Clean: ${clean}, Dirty: ${dirty}, Inspect: ${inspect}`)
        rooms.forEach(r => {
            parts.push(`  - Room ${r.number}: type=${r.type}, status=${r.status}, occupancy=${r.occupancy}, floor=${r.floor || 'N/A'}`)
        })
    }

    // ── TOURS ─────────────────────────────────
    const tours = useTourStore.getState().tours
    if (tours.length > 0) {
        parts.push(`[TOURS] ${tours.length} tours:`)
        tours.forEach(t => {
            const days = t.operating_days?.join(', ') || 'N/A'
            parts.push(`  - ${t.name}: Adult €${t.adult_price}, Child(3-7) €${t.child_3_7_price}, Child(0-3) €${t.child_0_3_price}, Base €${t.base_price_eur}, Days: ${days}, Active: ${t.is_active}`)
        })
    }

    // ── FEEDBACK / COMPLAINTS ─────────────────
    const complaints = useFeedbackStore.getState().complaints
    if (complaints.length > 0) {
        const newComplaints = complaints.filter(c => c.status === 'new')
        parts.push(`[ANONYMOUS FEEDBACK] Total: ${complaints.length}, New/Unread: ${newComplaints.length}`)
        newComplaints.slice(0, 5).forEach(c => {
            parts.push(`  - ${c.content?.substring(0, 100) || ''}`)
        })
    }

    // ── STAFF MEAL / DAILY MENU ───────────────
    const todayMenu = useStaffMealStore.getState().todayMenu
    if (todayMenu) {
        parts.push(`[TODAY'S STAFF MENU] ${todayMenu.menu || 'Not set'}`)
    }

    // ── CURRENCY / EXCHANGE RATES ─────────────
    const currency = useCurrencyStore.getState()
    if (currency.rates) {
        const { USD, EUR, GBP } = currency.rates
        const rateParts: string[] = []
        if (USD) rateParts.push(`USD: Buy ${USD.buying.toFixed(2)}, Sell ${USD.selling.toFixed(2)}`)
        if (EUR) rateParts.push(`EUR: Buy ${EUR.buying.toFixed(2)}, Sell ${EUR.selling.toFixed(2)}`)
        if (GBP) rateParts.push(`GBP: Buy ${GBP.buying.toFixed(2)}, Sell ${GBP.selling.toFixed(2)}`)
        if (rateParts.length > 0) parts.push(`[EXCHANGE RATES TRY] ${rateParts.join(' | ')}`)
    }

    // ── OFF-DAY REQUESTS ──────────────────────
    const offDayRequests = useOffDayStore.getState().requests
    if (offDayRequests.length > 0) {
        const pending = offDayRequests.filter(r => r.status === 'pending')
        const approved = offDayRequests.filter(r => r.status === 'approved')
        parts.push(`[OFF-DAY REQUESTS] Total: ${offDayRequests.length}, Pending: ${pending.length}, Approved: ${approved.length}`)
        pending.slice(0, 5).forEach(r => {
            parts.push(`  - ${r.staff_name}: ${r.date} (${r.reason || 'No reason'})`)
        })
    }

    return parts.join('\n')
}

const SYSTEM_PROMPT = `You are Relay AI, the intelligent assistant for a hotel management platform called "Relay".
You have real-time access to ALL of the hotel's data including: current shift, active notes, sales, pricing, roster, rooms, tours, maintenance logs/tickets, exchange rates, staff menu, off-day requests, and anonymous feedback.

Your responsibilities:
- Answer questions about the hotel's current operational state
- Help with pricing queries (room prices, agency prices, overrides, tour prices)
- Summarize active notes, sales, shift information, and open tickets
- Provide room status and occupancy information
- Share exchange rates and do currency conversions
- Report on staff roster, off-day requests, and daily menu
- Help draft emails, reports, or review responses based on the selected task mode
- Answer general hospitality questions

Rules:
- Be concise and professional
- Respond in the same language the user writes in (Turkish or English)
- When providing prices, always include the currency
- Reference specific data from the context when relevant
- If you don't have enough data to answer, say so clearly`

function generateTitle(firstMessage: string): string {
    const text = firstMessage.trim()
    if (text.length <= 30) return text
    return text.substring(0, 30).trim() + '…'
}

export const useChatStore = create<ChatStore>((set, get) => ({
    threads: [],
    activeThreadId: null,
    isOpen: false,
    showSidebar: false,
    loading: false,
    selectedModel: 'gemini-2.5-flash',
    selectedTask: 'general',

    toggleOpen: () => set(s => ({ isOpen: !s.isOpen })),
    setOpen: (open) => set({ isOpen: open }),
    toggleSidebar: () => set(s => ({ showSidebar: !s.showSidebar })),
    setModel: (model) => set({ selectedModel: model }),
    setTask: (task) => set({ selectedTask: task }),

    createThread: () => {
        const id = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        const newThread: ChatThread = {
            id,
            title: 'Yeni Sohbet',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }
        set(s => ({
            threads: [newThread, ...s.threads],
            activeThreadId: id,
            showSidebar: false
        }))
        return id
    },

    switchThread: (threadId) => {
        set({ activeThreadId: threadId, showSidebar: false })
    },

    deleteThread: (threadId) => {
        set(s => {
            const remaining = s.threads.filter(t => t.id !== threadId)
            const newActiveId = s.activeThreadId === threadId
                ? (remaining[0]?.id || null)
                : s.activeThreadId
            return { threads: remaining, activeThreadId: newActiveId }
        })
    },

    sendMessage: async (text: string) => {
        let { activeThreadId, selectedModel, selectedTask } = get()

        // Auto-create thread if none active
        if (!activeThreadId) {
            activeThreadId = get().createThread()
        }

        const userMsg: ChatMessage = {
            id: `msg_${Date.now()}_user`,
            role: 'user',
            content: text,
            timestamp: new Date()
        }

        // Add user message to active thread
        set(s => ({
            threads: s.threads.map(t =>
                t.id === activeThreadId
                    ? {
                        ...t,
                        messages: [...t.messages, userMsg],
                        updatedAt: new Date(),
                        // Auto-title from first message
                        title: t.messages.length === 0 ? generateTitle(text) : t.title
                    }
                    : t
            ),
            loading: true
        }))

        try {
            const context = buildContext()
            const thread = get().threads.find(t => t.id === activeThreadId)
            const history = (thread?.messages || []).slice(-10).map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n')

            const fullPrompt = history ? `${history}\nUser: ${text}` : text

            const result = await useAIStore.getState().generate(
                fullPrompt,
                selectedModel,
                selectedTask,
                `${SYSTEM_PROMPT}\n\n[HOTEL DATA CONTEXT]\n${context}`
            )

            const aiMsg: ChatMessage = {
                id: `msg_${Date.now()}_ai`,
                role: 'assistant',
                content: result || 'Üzgünüm, şu an yanıt üretemiyorum. Lütfen tekrar deneyin.',
                timestamp: new Date()
            }

            set(s => ({
                threads: s.threads.map(t =>
                    t.id === activeThreadId
                        ? { ...t, messages: [...t.messages, aiMsg], updatedAt: new Date() }
                        : t
                ),
                loading: false
            }))
        } catch (error) {
            console.error('Chat error:', error)
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                role: 'assistant',
                content: 'Bir hata oluştu. Lütfen tekrar deneyin.',
                timestamp: new Date()
            }
            set(s => ({
                threads: s.threads.map(t =>
                    t.id === activeThreadId
                        ? { ...t, messages: [...t.messages, errorMsg], updatedAt: new Date() }
                        : t
                ),
                loading: false
            }))
        }
    }
}))
