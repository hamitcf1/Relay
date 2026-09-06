# Remove attendance declarations and cash handover implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove employee clock-in/clock-out declarations and remove shift cash handover from the product.

**Architecture:** Keep roster scheduling and the operational shift record used by compliance. Remove attendance collection/reporting end to end, and simplify shift persistence so operational shifts contain no cash values.

**Tech Stack:** React 19, TypeScript, Zustand, Firebase/Firestore, Firebase Functions

**Spec:** User request in the 2026-09-06 Codex task.

## Global Constraints

- Preserve weekly roster scheduling.
- Preserve compliance tracking tied to the current operational shift.
- Preserve hotel safe and encrypted credential features; they are unrelated to cash handover.
- Do not delete existing production records.

---

### Task 1: Remove employee attendance declarations

**Files:**
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/dashboard/OperationsGrid.tsx`
- Modify: `src/components/dashboard/OperationsOverview.tsx`
- Modify: `src/stores/authStore.ts`
- Modify: `src/components/activity/ActivityLogPanel.tsx`
- Modify: `src/types/index.ts`
- Modify: `firestore.rules`
- Modify: `functions/index.js`
- Delete: attendance components, store, hook, and helper

**Interfaces:**
- Consumes: Existing roster and dashboard navigation.
- Produces: A dashboard with no clock-in/out action or attendance report.

- [x] Remove attendance subscriptions, widgets, routes, navigation, metrics, and activity labels.
- [x] Remove attendance write rules and scheduled auto clock-out function.
- [x] Delete attendance-only source modules and types.
- [x] Run type checking and linting.

### Task 2: Remove shift cash handover

**Files:**
- Modify: `src/stores/shiftStore.ts`
- Modify: `src/hooks/useShiftAutomator.ts`
- Modify: `src/stores/chatStore.ts`
- Modify: `src/types/index.ts`
- Delete: `src/components/layout/ShiftManagementModal.tsx`
- Modify: public product copy that advertises cash handover

**Interfaces:**
- Consumes: Current operational shift lifecycle.
- Produces: Operational shift documents and AI context without cash fields.

- [x] Remove cash parameters and fields from shift creation, closing, loading, and demo data.
- [x] Remove cash handover UI and public marketing claims.
- [x] Run repository-wide residue scan, build, and relevant browser checks.
