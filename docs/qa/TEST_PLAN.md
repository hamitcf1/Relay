# Aetherius Relay - QA Master Test Plan

## 1. Overview & Objective
This document outlines the Quality Assurance (QA) and End-to-End (E2E) testing strategy for **Aetherius Relay** (Digital Handover System for Hotels).

The primary goal of this testing suite is to ensure reliability, usability, role-based access security, and smooth user transitions across marketing, authentication, live demo, and operational dashboard modules.

---

## 2. Test Scope

### 2.1 In Scope
- **Public & Marketing Pages**: Landing page (`/`), Pricing (`/pricing`), Features (`/features`), How It Works (`/how-it-works`), Blog (`/blog`), Legal & Terms (`/legal/*`), Downloads (`/download`).
- **Authentication & Authorization**: Login page (`/login`), Registration page (`/register`), Hotel Setup (`/setup-hotel`), Protected Route Guards (`/dashboard`, `/operations`).
- **Live Demo & Simulation**: Sandbox environment (`/live-demo`), interactive hotel handover simulations, log creation, roster overview.
- **Responsive Layout & Mobile Support**: Responsive design checks for mobile viewports (Pixel 5 emulation) and desktop screens.
- **UI & Accessibility Components**: Cyber loading transitions, modal dialogs, tab notifications, theme toggling.

### 2.2 Out of Scope (For E2E UI Tests)
- Live production Firebase Firestore mutations (handled via mock state / demo mode in UI E2E runs).
- Real SMS / Email gateway integrations.

---

## 3. Test Architecture & Tools

- **Framework**: [Playwright](https://playwright.dev/) (`@playwright/test`)
- **Language**: TypeScript
- **Target Browsers**: Chromium (Desktop Chrome), Chromium (Mobile Pixel 5 Emulation).
- **Execution Command**: `npm run test:e2e`
- **Interactive Debugging**: `npm run test:e2e:ui`
- **Report Viewing**: `npm run test:e2e:report`

---

## 4. Test Environment & Execution
- Tests automatically launch a local Vite development server at `http://localhost:5173`.
- Artifacts (traces, screenshots, video recordings on failure) are stored under `playwright-report/` and `test-results/`.

---

## 5. Traceability & Naming Conventions
Each test case is assigned a unique Test ID in `docs/qa/TEST_CASES.md`:
- `TC-PUB-xxx`: Public Page & Marketing Tests
- `TC-AUTH-xxx`: Auth, Registration & Route Security Tests
- `TC-DEMO-xxx`: Live Demo & Interactive Sandbox Tests
- `TC-DASH-xxx`: Operational Dashboard & Log Tests
