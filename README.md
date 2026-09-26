# 🏨 Aetherius Relay - Cyber-Concierge Hotel Operations & Digital Handover Platform

<div align="center">

  <br />

  ![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Firebase](https://img.shields.io/badge/Backend-Firebase%20v11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
  ![Zustand](https://img.shields.io/badge/State-Zustand-764ABC?style=for-the-badge)
  ![i18n](https://img.shields.io/badge/Localization-TR%20%7C%20EN%20%7C%20RU-emerald?style=for-the-badge)
  ![License](https://img.shields.io/badge/License-Proprietary-rose?style=for-the-badge)

  <br />

  **Aetherius Relay** is an enterprise-grade, real-time "Digital Handover" and operational management ecosystem designed for modern hotels, resorts, and boutique accommodation properties.

  *Eliminate paper logbooks, lost shift notes, and unstructured messaging groups with a unified, real-time command platform.*

</div>

---

## 🌟 Executive Overview

In 24/7 hotel operations, information loss during shift handovers leads to unfulfilled guest requests, maintenance oversights, and revenue leakage. **Aetherius Relay** solves this by establishing a single source of truth across all hotel departments—Reception, Housekeeping, Guest Relations, Maintenance, and Management.

Designed with a high-contrast **"Cyber-Concierge"** aesthetic (`zinc-950` obsidian background, glassmorphic card overlays, fluid Framer Motion micro-interactions), Relay delivers maximum visual clarity under demanding front-desk conditions.

---

## 🔥 Key Operational Modules & Features

### 🎟️ Tour, Transfer & Service Sales Hub
- **Unique Reservation Engine (`#RES-XXXXXX`)**: Automatically generates and tracks immutable, searchable reservation codes for every tour, airport transfer, and laundry service order.
- **Dynamic Digital Vouchers**: Instant digital voucher generation complete with scannable QR codes, printable guest receipts, and bilingual (`TR / EN`) ticket stubs.
- **Type-Aware Voucher Editing**: Contextual editing forms that dynamically adjust fields based on service type:
  - *Transfer*: Pickup location, destination, flight code, room no, pickup time.
  - *Tour*: Tour catalogue item, pax count, room no, departure time.
  - *Laundry*: Room no, service type (washing/ironing/both), piece count, delivery window.
- **Global Instant Search**: Search sales by reservation code (`#RES-...`), guest name, telephone, room number, or flight code with zero latency.
- **Multi-Currency & FX Engine**: Supports `EUR (€)`, `USD ($)`, `GBP (£)`, and `TRY (₺)` transactions with real-time exchange rate calculation against TRY.

### 🔄 Shift Handover & Compliance Wizard
- **Step-by-Step Handover Flow**: Ensures no unread logs or pending guest issues pass to the oncoming shift unaddressed.
- **Visual Compliance Ring ("Pulse")**: Real-time tracking of mandatory daily regulatory compliance:
  - **KBS (Identity Reporting System)** status verification.
  - **Agency Message & Booking System** audits.
- **Shift Shift Timer**: Active countdown and time tracking for Morning (A), Evening (B), Night (C), and Extra (E) shifts.

### 📜 Smart Log Feed & Room Linking
- **Real-Time Log Stream**: Collaborative live feed of guest requests, complaints, and operational notes.
- **Smart `#RoomNumber` Parsing**: Auto-detects room mentions (e.g. `#104`) in log text to display historical guest activity and pending tasks in a single tap.
- **Priority & SLA Badges**: Categorizes items as `low`, `medium`, `high`, or `critical` with visual glowing indicators.

### 🛠️ Maintenance Queue & Asset Tracking
- **SLA Ticket Lifecycle**: Open, in-progress, resolved, and archived states for engineering and housekeeping tickets.
- **Target Resolution Time (`due_at`)**: Configurable resolution deadlines with visual deadline indicators.

### 📅 Staff Roster & Scheduling Grid
- **Interactive Weekly Roster Matrix**: Visual staff scheduling matrix for General Managers (GMs).
- **Off-Day Scheduler & Shift Requests**: Staff can request specific shift slots or off-days directly from their dashboard.
- **One-Click Roster Publishing**: Broadcasts updated weekly schedules to staff instant notification feeds.

### 💬 Internal Communication & Broadcasts
- **Direct Staff Messaging**: P2P threaded messaging between hotel team members.
- **GM Broadcast Banners**: High-priority managerial announcements displayed across all active team screens.
- **Real-Time Notifications**: Audio alerts and desktop push notifications for urgent operational logs.

### 🛡️ Admin & Role-Based Access Control (RBAC)
- **Role Hierarchy**:
  - `gm` *(General Manager / Admin)*: Full system access, roster publishing, financial refund approvals, permanent trash purge privileges, staff account management.
  - `receptionist`: Front-desk operations, sales, log creation, shift handover completion.
  - `housekeeping`: Maintenance ticket updates, room status tracking.
- **Protected Trash Can**: Trash purging and permanent record deletion strictly protected under GM authorization guardrails.

---

## 🏗️ Technical Architecture & Data Model

Aetherius Relay leverages a multi-tenant Cloud Firestore architecture, providing strict data isolation per hotel property (`hotels/{hotelId}`).

```text
hotels/{hotelId}
├── info                       # Property details, hotel code (6-digit), settings
├── settings                   # Compliance times, laundry pricing, SLA defaults
├── users                      # Hotel staff user index & roles
├── logs                       # Operational notes, guest requests, feedback
├── shifts                     # Completed shift handover records & KBS checks
├── roster                     # Weekly staff schedule matrices
├── sales                      # Sales records (Tours, Transfers, Laundry, Other)
├── maintenance                # Maintenance & room repair tickets
├── announcements              # Property-wide GM announcements
└── chat_messages             # Internal staff communications
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS 3.4](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/) |
| **Animation Engine** | [Framer Motion](https://www.framer.com/motion/) |
| **State Management** | [Zustand](https://docs.pmnd.rs/zustand) |
| **Backend & Auth** | [Firebase v11](https://firebase.google.com/) (Authentication, Cloud Firestore, Cloud Storage) |
| **Localization (i18n)** | Custom Tri-lingual Engine (`Turkish`, `English`, `Russian`) |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) |
| **Hosting Target** | [Cloudflare Pages](https://pages.cloudflare.com/) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Firebase Project**: Firestore Database enabled with Authentication.

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/hamitcf1/Relay.git
   cd Relay
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Launch Local Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts Vite development server with HMR |
| `npm run build` | `npm run version && tsc -b && vite build` | Type-checks code & builds production bundle |
| `npm run preview` | `vite preview` | Previews production build locally |
| `npm run test:demo-writes` | `node scripts/scan-demo-writes.mjs` | Audits code for demo-mode write guards |
| `npm run lint` | `eslint .` | Runs ESLint syntax and code quality checks |

---

## 🔒 Security & Demo Guards

Aetherius Relay incorporates automated code scanners (`scripts/scan-demo-writes.mjs`) to ensure that demo accounts (`user.is_demo === true`) cannot mutate production Firestore collections. All database writes are guarded by safety checks.

---

<div align="center">

  <sub>Built with precision for hospitality excellence by the **Aetherius Relay Team**.</sub>

</div>
