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

const RELAY_APP_INFO = `
Relay (Aetherius Relay), modern oteller için tasarlanmış kapsamlı bir "Dijital Devir" ve operasyon yönetim platformudur.
Temel Özellikler ve Modüller:
1. Vardiya Devri (Shift Handover): Kağıt logbook'ların yerini alan modül. Kasa sayımı, personel takibi ve AI destekli devir notları içerir.
2. Aktif Log (Active Log): Arıza, misafir isteği ve şikayetlerin gerçek zamanlı takibi. #OdaNo (örn: #204) yazılarak odalara hızlı erişim sağlar.
3. Sabit Pano (Sticky Board): Önemli ve acil notların en üstte "glass" bir container içinde sabitlenmesi.
4. Uyum Nabzı (Compliance Pulse): KBS bildirimi ve Acente mesaj kontrolü gibi yasal zorunlulukların takibi. %100 uyum hedeflenir.
5. Handover Wizard: Vardiya sonu işlemlerini (para sayımı, açık işlerin devri, final notu) yönetir.
6. Roster (Nöbet Çizelgesi): Personel çalışma saatlerinin ve izinlerinin yönetimi. Sadece GM (Genel Müdür) erişebilir.
7. Olay Raporlama (Incident Reporting): Hasar veya hırsızlık durumlarında fotoğraf yüklemeli resmi rapor oluşturma.
8. Gizli Kasa (Vault): Hassas bilgilerin (şifreler, IBAN, fiyat listeleri) şifreli olarak saklanması.
9. Geri Bildirim (Feedback): Misafirlerin oda içindeki QR kodlar üzerinden ilettiği anonim görüşler.
10. Personel Yemeği: Günlük yemek menüsü takibi.
11. Döviz Kurları: Merkez Bankası bazlı anlık kur takibi ve otomatik TL çevirileri.
12. Satış Takibi: Tur, transfer ve çamaşırhane satışlarının oda numarası bazlı takibi ve ödeme durumu.
`;

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
        parts.push(`[HOTEL] Name: ${hotel.info?.name || 'N/A'}, Code: ${hotel.code || 'N/A'}`)
        if (hotel.settings?.knowledge_base) {
            parts.push(`[HOTEL MANUAL KNOWLEDGE BASE] This is specific information provided by the hotel manager: ${hotel.settings.knowledge_base}`)
        }
    }

    // ── SHIFT ─────────────────────────────────
    const shift = useShiftStore.getState().currentShift
    if (shift) {
        parts.push(`[CURRENT SHIFT] Type: ${shift.type}, Status: ${shift.status}, Date: ${shift.date}, Staff: ${shift.staff_ids.length} people, Cash Start: ${shift.cash_start} TRY`)
        parts.push(`[COMPLIANCE PULSE] KBS Checked: ${shift.compliance.kbs_checked ? 'YES' : 'NO'}, Agency Messages: ${shift.compliance.agency_msg_checked_count} checks performed.`)
        if (shift.handover_note) parts.push(`Handover Note: ${shift.handover_note}`)
    } else {
        parts.push('[CURRENT SHIFT] No active shift')
    }

    // ── NOTES ─────────────────────────────────
    const notes = useNotesStore.getState().notes
    const activeNotes = notes.filter(n => n.status === 'active')
    if (activeNotes.length > 0) {
        parts.push(`[ACTIVE NOTES] ${activeNotes.length} active notes:`)
        activeNotes.slice(0, 15).forEach(n => {
            parts.push(`  - [${n.category}/${n.priority || 'low'}] ${n.content} ${n.room_number ? `(Room ${n.room_number})` : ''} ${n.amount_due ? `Amount: ${n.amount_due} ${n.currency || 'TRY'}` : ''}`)
        })
    }

    // ── SALES ─────────────────────────────────
    const sales = useSalesStore.getState().sales
    const today = new Date().toISOString().split('T')[0]
    const todaySales = sales.filter(s => {
        try {
            return s.date.toISOString().split('T')[0] === today
        } catch { return false }
    })
    const pendingSales = sales.filter(s => s.payment_status !== 'paid')
    parts.push(`[SALES] Total Record: ${sales.length}, Today's Sales: ${todaySales.length}, Pending Payment: ${pendingSales.length}`)
    if (todaySales.length > 0) {
        todaySales.forEach(s => {
            parts.push(`  - ${s.type}: ${s.name} - ${s.customer_name} (Room ${s.room_number}) ${s.total_price} ${s.currency}, Status: ${s.payment_status}/${s.status || 'waiting'}`)
        })
    }

    // ── PRICING ───────────────────────────────
    const { basePrices, baseOverrides, agencies } = usePricingStore.getState()
    if (basePrices?.prices) {
        const priceLines = ROOM_TYPES
            .filter(r => basePrices.prices[r])
            .map(r => `${r}: ${basePrices.prices[r]!.amount} ${basePrices.prices[r]!.currency}`)
        if (priceLines.length > 0) {
            parts.push(`[BASE ROOM PRICES] ${priceLines.join(', ')}`)
        }
    }
    if (baseOverrides.length > 0) {
        parts.push(`[PRICE OVERRIDES] ${baseOverrides.length} active period overrides`)
        baseOverrides.slice(0, 5).forEach(o => {
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
        parts.push(`[ROSTER] ${roster.staff.length} staff members tracked.`)
        const todayDate = new Date()
        const todayShifts = roster.getShiftsForDate(todayDate)
        if (todayShifts.length > 0) {
            parts.push(`Today's Staff on Duty: ${todayShifts.map(s => `${s.name} (${s.shift})`).join(', ')}`)
        }
    }

    // ── LOGS / TICKETS ────────────────────────
    const logs = useLogsStore.getState().logs
    if (logs.length > 0) {
        const openLogs = logs.filter(l => l.status === 'open')
        parts.push(`[LOGS/TICKETS] Total: ${logs.length}, Open: ${openLogs.length}`)
        openLogs.slice(0, 15).forEach(l => {
            parts.push(`  - [${l.type}/${l.urgency}] ${l.content} ${l.room_number ? `(Room ${l.room_number})` : ''} by ${l.created_by_name}`)
        })
    }

    // ── TOURS ─────────────────────────────────
    const tours = useTourStore.getState().tours
    if (tours.length > 0) {
        parts.push(`[TOURS CATALOGUE]`)
        tours.filter(t => t.is_active).forEach(t => {
            const days = t.operating_days?.join(', ') || 'N/A'
            parts.push(`  - ${t.name}: Adult €${t.adult_price}, Child €${t.child_3_7_price}, Days: ${days}`)
        })
    }

    // ── FEEDBACK ──────────────────────────────
    const complaints = useFeedbackStore.getState().complaints
    if (complaints.length > 0) {
        const newComplaints = complaints.filter(c => c.status === 'new')
        parts.push(`[GUEST FEEDBACK] Total: ${complaints.length}, Unread: ${newComplaints.length}`)
        newComplaints.slice(0, 5).forEach(c => {
            parts.push(`  - ${c.content}`)
        })
    }

    // ── CURRENCY ──────────────────────────────
    const currency = useCurrencyStore.getState()
    if (currency.rates) {
        const { USD, EUR, GBP } = currency.rates
        const rateParts: string[] = []
        if (USD) rateParts.push(`USD: ${USD.buying.toFixed(2)}`)
        if (EUR) rateParts.push(`EUR: ${EUR.buying.toFixed(2)}`)
        if (GBP) rateParts.push(`GBP: ${GBP.buying.toFixed(2)}`)
        if (rateParts.length > 0) parts.push(`[EXCHANGE RATES TRY] ${rateParts.join(' | ')}`)
    }

    // ── STAFF MEAL / DAILY MENU ───────────────
    const todayMenu = useStaffMealStore.getState().todayMenu
    if (todayMenu) {
        parts.push(`[TODAY'S STAFF MENU] ${todayMenu.menu || 'Not set'}`)
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

const PUBLIC_SYSTEM_PROMPT = `You are Relay Customer Support AI. You represent "Relay", the high-end hotel operations platform.
Your mission is to inform potential clients about Relay's capabilities and help them understand its value.

Relay Overview:
${RELAY_APP_INFO}

Guidelines:
- Explain features like Shift Handover, Compliance Pulse, and Handover Wizard clearly.
- Mention that Relay replaces paper logbooks and messaging apps with a centralized, professional system.
- Professional, sales-oriented, and welcoming tone.
- DO NOT share any internal hotel data (you don't have access to it in this mode).
- If asked about a specific hotel's data, politely explain that you are the general support bot and they must log in to their dashboard.
- Always offer to help with demo requests or general platform questions.`

const INTERNAL_SYSTEM_PROMPT = `You are Relay AI, the ultimate intelligent operational partner for the hotel.
You have real-time access to every heartbeat of the hotel's operations.

Application Architecture & Features:
${RELAY_APP_INFO}

Your Capabilities:
- Summarize shifts and identify missing compliance checks (KBS/Agency).
- Analyze sales performance and pending payments.
- Help with guest requests and maintenance tickets.
- Draft professional emails, reports (tutanak), and review responses based on actual data.
- Provide room status, tour prices, and currency calculations instantly.

Operational Rules:
- Be precise. Use room numbers and names from the context.
- Always include currency (TRY, EUR, USD, GBP) when discussing money.
- Prioritize information from the [HOTEL MANUAL KNOWLEDGE BASE] for hotel-specific rules (breakfast times, pool rules, etc.).
- Maintain a proactive, professional, and efficient tone.
- Respond in the same language the user uses.`

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
        let { activeThreadId } = get()
        const { selectedModel, selectedTask, isPublic } = get()

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
