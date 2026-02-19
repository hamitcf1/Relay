# GEMINI.md - Context & Instructions for Aetherius Relay


## 1. Project Overview

**Project Name:** Aetherius Relay
**Description:** A comprehensive "Digital Handover" system designed for modern hotels. It replaces traditional paper logbooks and messaging apps with a centralized platform for managing shift transfers, operational logs, maintenance tickets, compliance checks (KBS, Agency Messages), and staff rosters.
**Design Aesthetic:** "Cyber-Concierge" (Dark Mode, Glassmorphism, Fluid Animations).

## 2. Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **Styling:** Tailwind CSS, ShadCN UI, Framer Motion
*   **Backend:** Firebase (Authentication, Firestore)
*   **State Management:** Zustand
*   **Routing:** React Router DOM (v7)
*   **Deployment:** Cloudflare Pages (intended)

## 3. Architecture & Directory Structure

### Key Directories
*   `src/components/`: Reusable UI components.
    *   `src/components/ui/`: Base ShadCN components (button, card, etc.).
    *   `src/components/[feature]/`: Feature-specific components (e.g., `logs`, `roster`, `compliance`).
*   `src/stores/`: Global state management using Zustand (e.g., `hotelStore.ts`, `authStore.ts`).
*   `src/pages/`: Main route components (`DashboardPage`, `OperationsPage`, etc.).
*   `src/lib/`: Utilities and configuration (`firebase.ts`, `utils.ts`).
*   `src/types/`: TypeScript type definitions (crucial for Firestore schema alignment).
*   `.issues/`: Local issue tracking for the AI agent.

### Data Architecture (Firestore)
The application uses a multi-tenant architecture where data is nested under `hotels/{hotelId}`.
*   **Collections:**
    *   `users`: Global user profiles (linked to a hotel via `hotel_id`).
    *   `hotels`: Contains hotel settings and sub-collections for data.
        *   `logs`: Operational logs and tickets.
        *   `shifts`: Shift records and handover data.
        *   `roster`: Weekly staff schedules.
        *   `incidents`: Damage/Theft reports.

## 4. Building & Running

**Prerequisites:** Node.js, NPM.

**Key Commands:**
*   `npm install`: Install dependencies.
*   `npm run dev`: Start the local development server (Vite).
*   `npm run build`: Type-check (`tsc`) and build for production.
*   `npm run lint`: Run ESLint.
*   `npm run preview`: Preview the production build locally.

## 5. Development Conventions

*   **Strict TypeScript:** All new code must be fully typed. Use `src/types/index.ts` as the source of truth for data models.
*   **Component Composition:** Use existing ShadCN UI components from `src/components/ui` whenever possible before creating custom elements.
*   **Styling:** Use Tailwind utility classes. Follow the `dark` theme convention defined in `tailwind.config.js` and `index.css`.
*   **State Management:** distinct logic belongs in Zustand stores (`src/stores`), not inside components.
*   **Security:** Adhere to `firestore.rules`. Ensure GMs have elevated permissions where applicable, and users can only access data for their assigned hotel.
*   **Issue Tracking:** Use the `.issues` directory to track features and bugs as Markdown files.

## 6. Key Configuration Files

*   `RELAY_MASTER_SPEC.md`: The "Bible" of the project. Contains the detailed product specification and feature requirements. **Read this first when implementing new features.**
*   `firebase.json` & `firestore.rules`: Security and deployment rules for the backend.
*   `tailwind.config.js`: Custom theme configuration (colors, animations).
*   `vite.config.ts`: Build configuration and path aliases (`@/`).
*   `src/lib/firebase.ts`: Firebase initialization and environment variable mapping.
