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
    settings?: {
        language?: 'en' | 'tr'
        onboarding_seen?: boolean
        dismissed_announcements?: string[]
    }
}

export interface HotelInfo {
    name: string
    address: string
}

export interface HotelSettings {
    kbs_time: string
    check_agency_intervals: number[]
    staff_order?: string[]
}

export interface Hotel {
    id: string
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
}

// Input type for creating new logs
export type LogInput = Omit<Log, 'id' | 'created_at'> & {
    created_at?: any // Can be FieldValue on write
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

export interface AppState {
    currentHotelId: string | null
    currentShift: Shift | null
    compliancePulse: CompliancePulse
}
