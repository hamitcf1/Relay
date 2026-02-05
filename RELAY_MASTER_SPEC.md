# Project Relay: Hotel Handover & Operations System (Master Spec)

## 1. Project Overview
**App Name:** Relay
**Platform:** Web (PWA-ready)
**Stack:** React (Vite), TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, Firebase (Auth, Firestore, Storage), Cloudflare Pages.
**Design Aesthetic:** "Cyber-Concierge." High-end 2026 dark mode, fluid animations, glassmorphism, glowing accents for critical alerts.

## 2. Core Purpose
A comprehensive "Digital Handover" system for hotels that replaces paper logbooks and WhatsApp groups. It manages shift transfers, operational logs, maintenance tickets, and compliance checks (KBS, Agency Messages).

## 3. Data Architecture (Firestore)
*The Agent MUST implement this schema strictly.*

### Collections
1.  `users` (Document ID: `uid`)
    * `email`: string
    * `name`: string
    * `role`: 'gm' | 'receptionist' | 'housekeeping'
    * `current_shift_type`: 'A' | 'B' | 'C' | 'E' | null

2.  `hotels` (Document ID: `hotel_id`) - *Enables Multi-tenancy*
    * `info`: { `name`: string, `address`: string }
    * `settings`: { `kbs_time`: string, `check_agency_intervals`: [numbers] }
    
    * **Sub-Collection:** `logs`
        * `type`: 'maintenance' | 'guest_request' | 'complaint' | 'system'
        * `content`: string
        * `room_number`: string | null
        * `urgency`: 'low' | 'medium' | 'critical'
        * `status`: 'open' | 'resolved'
        * `created_at`: timestamp
        * `created_by`: user_ref
        * `is_pinned`: boolean (for "Sticky Board")

    * **Sub-Collection:** `shifts`
        * `shift_id`: string (e.g., "2026-02-05_SHIFT_A")
        * `date`: string
        * `type`: 'A' | 'B' | 'C' | 'E'
        * `staff_ids`: [string]
        * `compliance`: { `kbs_checked`: boolean, `agency_msg_checked_count`: number }
        * `cash_start`: number
        * `cash_end`: number
        * `handover_note`: string (AI Summarized)
        * `status`: 'active' | 'closed'

    * **Sub-Collection:** `incidents`
        * `type`: 'damage' | 'theft'
        * `room`: string
        * `item`: string
        * `cost`: number
        * `status`: 'pending_payment' | 'paid' | 'waived'
        * `photo_url`: string

    * **Sub-Collection:** `vault` (Static Info)
        * `category`: 'financial' | 'tours' | 'transfer'
        * `data`: key-value map (e.g., { 'rafting': 50, 'iban': 'TR...' })

    * **Sub-Collection:** `roster`
        * `week_start`: string
        * `schedule`: Map<UserId, Map<Day, ShiftType>>

## 4. Key Features & Implementation Rules

### A. The "2026" UI/UX (Frontend)
1.  **Framework:** Use `shadcn-ui` for all base components (Cards, Dialogs, Inputs).
2.  **Animations:** Use `framer-motion` for:
    * **Page Transitions:** Smooth fade/slide when navigating routes.
    * **Feed Updates:** New logs must `AnimatePresence` slide down, not just appear.
    * **Interactions:** Buttons must have active states (scale down slightly on click).
3.  **Theme:** Force Dark Mode. Backgrounds should be `zinc-950`. Accents:
    * Primary: `indigo-500` (General UI)
    * Critical: `rose-500` + `animate-pulse` (Emergencies)
    * Success: `emerald-400` (Money/Task Done)
4.  **Login:** Cinematic entry. Animated background element.

### B. Functional Modules

#### 1. The "Compliance Pulse" Ring
* **Logic:** A visual circular progress bar in the header.
* **Rules:**
    * Starts at 0% at shift start.
    * Increases by 50% when "Agency Messages" checked.
    * Increases by 50% when "KBS" checked.
    * If KBS is unchecked by 23:00 (Shift B/C), trigger fullscreen modal alert.

#### 2. The "Active Log" Feed
* **Logic:** Real-time Firestore listener (`onSnapshot`).
* **Feature:** Auto-link rooms. If user types "#204", render it as a clickable badge that opens Room 204's history.

#### 3. The "Sticky Board"
* **Logic:** Filter logs where `is_pinned == true`. Display in a horizontal scrolling "glass" container above the main feed.

#### 4. The "Handover Wizard" (End Shift)
* **Trigger:** "End Shift" button.
* **Steps:**
    1.  **Open Ticket Review:** Show all `status: 'open'` logs. Force user to "Pass" or "Resolve".
    2.  **Money Count:** Input `cash_end`. Calculate difference from `cash_start` + `income` - `expenses`. Show Red/Green diff.
    3.  **Final Note:** Text area for summary.

#### 5. The "Roster" (GM Access Only)
* **Logic:** Matrix View. Rows = Staff, Columns = Mon-Sun.
* **Interaction:** Click cell to cycle A -> B -> C -> E -> OFF.
* **Security:** Only visible if `user.role === 'gm'`.

#### 6. Incident Reporting
* **Flow:** Select Room -> Select Item -> Snap Photo -> Upload to Storage -> Create Firestore Doc.
* **Alert:** If a room with `status: 'pending_payment'` tries to check out, show modal warning.

## 5. Security & Deployment
1.  **Firestore Rules:**
    * `allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/hotels/$(hotelId)/users).data.staff_list`
    * `allow write to /roster: if request.auth.token.role == 'gm'`
2.  **Hosting:** Cloudflare Pages.
3.  **Env Variables:**
    * `VITE_FIREBASE_API_KEY`
    * `VITE_FIREBASE_AUTH_DOMAIN`
    * `VITE_FIREBASE_PROJECT_ID`

## 6. Development Phases (Agent Instructions)
1.  **Phase 1:** Setup scaffolding (Vite, Tailwind, Firebase).
2.  **Phase 2:** Build Auth & User Context (Zustand Store).
3.  **Phase 3:** implement the "Active Log" and "Sticky Board".
4.  **Phase 4:** Build the "Compliance Pulse" and Roster.
5.  **Phase 5:** Build the "Handover Wizard" and Incident flows.
6.  **Phase 6:** Polish animations and deployment.