# 🏨 Relay - The Cyber-Concierge Operations Hub

[![Built with React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Styled with Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Backend: Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Architecture: SaaS](https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-indigo)](https://relay.hotel)

**Relay** is a next-generation "Digital Handover" and hotel operations management system. Designed to replace outdated paper logbooks and fragmented messaging apps, Relay provides a centralized, real-time command center for modern hospitality teams.

---

## ✨ Vision: The "Cyber-Concierge" Experience

Relay isn't just a tool; it's a design-forward platform. Adhering to a **"Cyber-Concierge"** aesthetic, it features:
- **Dark Mode Excellence:** A deep `zinc-950` interface with high-contrast glowing accents.
- **Glassmorphism:** Elegant, translucent UI components that feel premium and modern.
- **Fluid Animations:** Powered by `framer-motion` for a tactile, responsive user experience.
- **Visual Urgency:** Dynamic alerts and the "Compliance Pulse" keep teams focused on what matters.

---

## 🚀 Key Features
### 📡 Real-Time Operations Feed
*   **Active Log Feed:** Collaborative, real-time logging of guest requests, maintenance, and complaints.
*   **Room Smart-Linking:** Automatically identifies `#RoomNumbers` in logs to provide instant guest history and context.

### 🔄 Shift Handover Wizard
*   **Automated Summaries:** A step-by-step wizard to ensure no open ticket is forgotten during shift change.
*   **Cash Reconciliation:** Integrated financial tracking with automatic difference calculation between shift start and end.
*   **Shift Compliance:** Tracks KBS (Identity Reporting) and Agency Message checks with a visual "Pulse" ring.

### 📅 Advanced Scheduling & Roster
*   **Roster Matrix:** A visual, drag-and-drop style staff scheduling system for General Managers.
*   **Shift Requests:** Staff can request specific shifts (Morning/Evening/Night) or Off Days directly from their dashboard.
*   **Multi-Shift Support:** Seamlessly manage Morning (A), Afternoon (B), Night (C), and Extra (E) shifts.

### 🌍 Tours & Transfer Sales
*   **Digital Catalogue:** Manage and book tours, transfers, and laundry services directly.
*   **Sales Tracking:** Track payments (Partial/Paid), generate reports, and attribute sales to specific staff members.
*   **Calendar Integration:** Automatically syncs tour bookings to the hotel calendar.

### 🏢 Multi-Tenancy & Hotel Management
*   **Hotel Code System:** Securely join staff to specific hotels using unique 6-digit codes.
*   **Role-Based Access:** Granular permissions for GMs, Receptionists, and Housekeeping staff.

### 🛠️ Internal Communications
*   **Peer-to-Peer Messaging:** Secure, threaded internal chat between any two staff members.
*   **Announcements:** GM-level broadcasts that appear as prominent banners for the entire team.

---

## 💻 Tech Stack

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **Backend:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Cloud Storage)
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 📂 Architecture

Relay is built on a **multi-tenant architecture**, ensuring data isolation and security for every hotel.

```text
hotels/{hotelId}
├── info (Name, Address, **Hotel Code**)
├── settings (Compliance times, intervals)
├── logs (Maintenance, Guest Requests)
├── shifts (Handover records, Compliance)
├── roster (Weekly staff schedules)
├── sales (Tours, Transfers, Laundry)
└── calendar_events (Synced bookings)
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- Firebase Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hamitfindik2/relay.git
   cd relay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is proprietary. All rights reserved.

---
*Built for the future of hospitality by the Relay Team.*