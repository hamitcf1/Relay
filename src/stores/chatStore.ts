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
    isPublic: boolean
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
    setIsPublic: (isPublic: boolean) => void
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
        parts.push(`[AGENCY PRICES (Base + Active Overrides)]`)
        agencies.forEach(a => {
            const activeOverride = a.overrides.find(o => {
                const now = new Date().toISOString().split('T')[0]
                return now >= o.start_date && now <= o.end_date
            })

            const prices = activeOverride?.prices || a.base_prices || {}
            const priceList = Object.entries(prices)
                .map(([room, price]) => `${room}: ${price.amount} ${price.currency}`)
                .join(', ')

            parts.push(`  - ${a.name}: ${priceList || 'No prices set'} ${activeOverride ? '(Active Override)' : ''}`)
        })
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

const PUBLIC_SYSTEM_PROMPT = `You are Relay Customer Support AI. You are a helpful assistant for the "Relay" hotel management platform.
Your goal is to help potential clients, travelers, or curious users understand what Relay is and how it can help their business.

Scope:
- Explain Relay's features (Shift transfers, operational logs, maintenance tickets, compliance checks, staff rosters).
- Discuss pricing plans and general benefits.
- Help with onboarding related questions or demo requests.
- Provide general hospitality best practices.

Rules:
- You DO NOT have access to any specific hotel's private data right now.
- DO NOT share room numbers, guest names, sales data, or internal notes.
- If asked about specific hotel operations, explain that you are the general support bot and they should log in to see their hotel's data.
- Be extremely professional, welcoming, and sales-oriented.`

const INTERNAL_SYSTEM_PROMPT = `You are Relay AI, the intelligent assistant for the hotel management platform "Relay".
You have real-time access to the hotel's operational data.

Your responsibilities:
- Answer questions about the hotel's current state (shifts, notes, sales, pricing, roster, rooms, tours, logs).
- Help draft operational content (emails, reports, review responses).
- Reference specific data from the context when relevant.

Rules:
- Be concise and professional.
- When providing prices, always include the currency.
- Respond in the same language the user writes in.`

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
    isPublic: true,

    toggleOpen: () => set(s => ({ isOpen: !s.isOpen })),
    setOpen: (open) => set({ isOpen: open }),
    setIsPublic: (isPublic) => set({ isPublic }),
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
        let { activeThreadId, selectedModel, selectedTask, isPublic } = get()

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
            // Context restricted if public
            const context = isPublic ? "PUBLIC SUPPORT MODE: No private hotel data accessible. Access denied to internal stores (rooms, sales, logs, etc.). Answer based on general Relay product info only." : buildContext()
            const thread = get().threads.find(t => t.id === activeThreadId)
            const history = (thread?.messages || []).slice(-10).map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n')

            const fullPrompt = history ? `${history}\nUser: ${text}` : text
            const systemPrompt = isPublic ? PUBLIC_SYSTEM_PROMPT : INTERNAL_SYSTEM_PROMPT

            const result = await useAIStore.getState().generate(
                fullPrompt,
                selectedModel,
                selectedTask,
                `${systemPrompt}\n\n[HOTEL DATA CONTEXT]\n${context}`
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
