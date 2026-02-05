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
    current_shift_type: ShiftType | null
}

export interface HotelInfo {
    name: string
    address: string
}

export interface HotelSettings {
    kbs_time: string
    check_agency_intervals: number[]
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

// ... (previous types)

// Room Types
export type RoomStatus = 'clean' | 'dirty' | 'inspect' | 'dnd'
export type RoomOccupancy = 'vacant' | 'occupied'
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'family'

export interface Room {
    id: string
    number: string
    type: RoomType
    status: RoomStatus
    occupancy: RoomOccupancy
    floor: number
    notes?: string
}

// ... (UI State Types)

export interface AppState {
    currentHotelId: string | null
    currentShift: Shift | null
    compliancePulse: CompliancePulse
}
