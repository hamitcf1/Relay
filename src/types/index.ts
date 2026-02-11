// ============================================
// RELAY - TypeScript Type Definitions
// Based on Firestore schema from RELAY_MASTER_SPEC.md
// ============================================

// User Roles
export type UserRole = 'gm' | 'receptionist' | 'housekeeping'

// Shift Types
export type ShiftType = 'A' | 'B' | 'C' | 'E'

// Log Types & Urgency
export type LogType = 'maintenance' | 'guest_request' | 'complaint' | 'system'
export type LogUrgency = 'low' | 'medium' | 'critical'
export type LogStatus = 'open' | 'resolved' | 'archived'

// Incident Types & Status
export type IncidentType = 'damage' | 'theft'
export type IncidentSeverity = 'low' | 'moderate' | 'serious' | 'severe'
export type IncidentStatus = 'pending_payment' | 'paid' | 'waived'

// Shift Status
export type ShiftStatus = 'active' | 'closed'

// Vault Categories
export type VaultCategory = 'financial' | 'tours' | 'transfer'

// ============================================
// Firestore Document Types
// ============================================

export interface User {
    uid: string
    email: string
    name: string
    role: UserRole
    hotel_id?: string | null
    current_shift_type: ShiftType | null
    settings?: UserSettings
    is_hidden_in_roster?: boolean
}

export interface UserSettings {
    language?: 'en' | 'tr'
    onboarding_seen?: boolean
    dismissed_announcements?: string[]
    theme?: 'light' | 'dark'
    accent_color?: string
    custom_cursor_enabled?: boolean
    show_datetime?: boolean
    collapsed_cards?: Record<string, boolean>
}

export interface HotelInfo {
    name: string
    address: string
}

export interface HotelSettings {
    kbs_time: string
    check_agency_intervals: number[]
    staff_order?: string[]
    safe_password?: string
    knowledge_base?: string // AI Knowledge Base context
    secret_info?: {
        agency_logins?: string
        kbs_logins?: string
        safe_info?: string
        openai_key?: string
        anthropic_key?: string
    }
    fixture_prices?: Record<string, number>
    minibar_prices?: Record<string, number>

}

export interface Hotel {
    id: string
    code?: string
    info: HotelInfo
    settings: HotelSettings
}

export interface Log {
    id: string
    type: LogType
    content: string
    room_number: string | null
    urgency: LogUrgency
    status: LogStatus
    created_at: Date
    created_by: string // user uid
    created_by_name: string // user display name
    is_pinned: boolean
    guest_name?: string
}

import { FieldValue } from 'firebase/firestore'

// Input type for creating new logs
export type LogInput = Omit<Log, 'id' | 'created_at'> & {
    created_at?: FieldValue | Date
}

export interface ShiftCompliance {
    kbs_checked: boolean
    agency_msg_checked_count: number
}

export interface Shift {
    shift_id: string
    date: string
    type: ShiftType
    staff_ids: string[]
    compliance: ShiftCompliance
    cash_start: number
    cash_end: number
    handover_note: string
    status: ShiftStatus
}

export interface Incident {
    id: string
    type: IncidentType
    room: string
    item: string
    cost: number
    status: IncidentStatus
    photo_url: string
}

export interface VaultEntry {
    id: string
    category: VaultCategory
    data: Record<string, string | number>
}

export interface RosterSchedule {
    [userId: string]: {
        [day: string]: ShiftType | 'OFF'
    }
}

export interface Roster {
    id: string
    week_start: string
    schedule: RosterSchedule
}

// ============================================
// UI State Types
// ============================================

export interface CompliancePulse {
    agencyChecked: boolean
    kbsChecked: boolean
    percentage: number
}

export interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
}
// Note categories
export type NoteCategory =
    | 'handover'       // General handover notes
    | 'damage'         // Property damage (payment collection)
    | 'early_checkout' // Early checkout info
    | 'guest_info'     // Guest-specific notes
    | 'feedback'       // Merged Live Feedback
    | 'upgrade'        // Room Upgrades (financial)
    | 'upsell'         // Upselling services (financial)
    | 'restaurant'     // Restaurant/Bar payments (financial)
    | 'minibar'        // Minibar usage (financial)
    | 'other'

export type NoteStatus = 'active' | 'resolved' | 'archived'

export interface ShiftNote {
    id: string
    category: NoteCategory
    content: string
    room_number: string | null
    is_relevant: boolean
    status: NoteStatus
    amount_due: number | null  // For damage notes
    is_paid: boolean           // For damage notes
    created_at: Date
    created_by: string | 'anonymous'
    created_by_name: string
    shift_id: string | null
    resolved_at: Date | null
    resolved_by: string | null
    is_anonymous?: boolean
    // Expanded properties for calendar sync & detailed tracking
    time?: string | null // HH:MM
    guest_name?: string | null
    assigned_staff_uid?: string | null
    assigned_staff_name?: string | null
    updated_at?: Date
}

// Room Types
export type RoomStatus = 'clean' | 'dirty' | 'inspect' | 'dnd'
export type RoomOccupancy = 'vacant' | 'occupied'
export type RoomType = 'standard' | 'corner' | 'corner_jacuzzi' | 'triple' | 'teras_suite'
export type BedConfig = 'separated' | 'together'

export interface Room {
    id: string
    number: string
    type: RoomType
    status: RoomStatus
    occupancy: RoomOccupancy
    floor: number
    bed_config?: BedConfig | null  // Only for standard rooms
    notes?: string
}

// Notification types
export type NotificationType = 'compliance' | 'message' | 'announcement' | 'off_day' | 'system'

export interface Notification {
    id: string
    type: NotificationType
    title: string
    content: string
    timestamp: Date
    is_read: boolean
    target_role?: UserRole | 'all'
    target_uid?: string
    link?: string
}

// Private Message
export interface PrivateMessage {
    id: string
    sender_id: string
    sender_name: string
    receiver_id: string // 'gm' or specific uid
    content: string
    timestamp: Date
    is_read: boolean
}

// Anonymous Complaint
export type ComplaintStatus = 'new' | 'reviewing' | 'resolved' | 'dismissed'
export interface AnonymousComplaint {
    id: string
    hotel_id: string
    content: string
    timestamp: Date
    status: ComplaintStatus
}

// Off Day Request
export type OffDayStatus = 'pending' | 'approved' | 'rejected'
export interface OffDayRequest {
    id: string
    staff_id: string
    staff_name: string
    date: string // yyyy-MM-dd
    reason: string
    status: OffDayStatus
    created_at: Date
    processed_at?: Date
    processed_by?: string
    // New fields for Shift Requests
    type?: 'off_day' | 'shift'
    shift_name?: string // e.g. 'morning', 'evening', 'night'
}

// Tour
export interface Tour {
    id: string
    name: string
    description: string
    base_price_eur: number
    adult_price: number
    child_3_7_price: number
    child_0_3_price: number
    operating_days: string[] // e.g. ['Monday', 'Wednesday']
    is_active: boolean
}

// Daily Menu (Staff Meal)
export interface DailyMenu {
    id: string
    hotel_id: string
    date: string // yyyy-MM-dd
    menu: string
    updated_at: Date
    updated_by: string
    updated_by_name: string
}

// ============================================
// Sales & Payments
// ============================================

export type SaleType = 'tour' | 'transfer' | 'laundry' | 'other'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type Currency = 'EUR' | 'TRY' | 'USD' | 'GBP'

export interface PaymentEntry {
    amount: number
    currency: Currency
    timestamp: Date
    method?: string // 'cash', 'card', 'room_charge'
    recorded_by?: string
}

// ============================================
// Agency Pricing (v2)
// ============================================

export type PricingCurrency = 'USD' | 'EUR'

export interface RoomPriceEntry {
    amount: number
    currency: PricingCurrency
}

export interface BasePrices {
    prices: { [key in RoomType]?: RoomPriceEntry }
    updated_at: Date
    updated_by: string
}

export interface AgencyOverride {
    id: string
    start_date: string // YYYY-MM-DD
    end_date: string   // YYYY-MM-DD
    prices: { [key in RoomType]?: RoomPriceEntry }
}

export interface BaseOverride {
    id: string
    start_date: string // YYYY-MM-DD
    end_date: string   // YYYY-MM-DD
    prices: { [key in RoomType]?: RoomPriceEntry }
}

export interface Agency {
    id: string
    name: string
    base_prices?: { [key in RoomType]?: RoomPriceEntry }
    overrides: AgencyOverride[]
    updated_at: Date
}

// ============================================
// Activity Tracking
// ============================================

export interface ActivitySession {
    start: Date
    end: Date | null
    duration_minutes: number
}

export interface ActivityLog {
    id: string // userId_YYYY-MM-DD
    user_id: string
    user_name: string
    hotel_id: string
    date: string // YYYY-MM-DD
    total_active_minutes: number
    sessions: ActivitySession[]
    last_active: Date
}

export interface Sale {
    id: string
    hotel_id: string
    type: SaleType
    name: string              // Tour name, Transfer destination, etc.
    customer_name: string     // Guest name
    room_number: string
    pax: number               // Number of people
    date: Date                // Date of service
    pickup_time?: string | null      // HH:MM
    ticket_number?: string    // External ticket #
    total_price: number
    collected_amount: number
    currency: Currency
    payment_status: PaymentStatus
    notes?: string
    payments?: PaymentEntry[]
    created_by: string
    created_by_name: string
    created_at: Date
    calendar_event_id?: string  // Link to auto-created calendar event
    updated_at?: Date
    updated_by?: string
    status?: SaleStatus       // New status field
}

export type SaleStatus = 'waiting' | 'confirmed' | 'cancelled' | 'pickup_pending' | 'realized' | 'delivered'

export interface AppState {
    currentHotelId: string | null
    currentShift: Shift | null
    compliancePulse: CompliancePulse
}
