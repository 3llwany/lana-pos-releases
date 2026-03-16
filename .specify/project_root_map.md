# Feature Specification: Project Root Map: Monorepo Architecture

**Feature Branch**: `master`  
**Created**: 2026-02-07  
**Status**: Draft  
**Input**: User description: "أنا شغال على مشروع Monorepo فيه api و ui. اشرح فيه إن عندي api (باك إيند) و ui (فرونت إيند) والعلاقة بينهم."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Full Project Overview (Priority: P1)

As a developer or stakeholder, I need a clear understanding of the project's high-level architecture so that I can navigate the codebase effectively.

**Why this priority**: Essential documentation for onboarding and architectural alignment.

**Independent Test**: Can be validated by reviewing the document and successfully navigating to both backend and frontend codebases.

**Acceptance Scenarios**:

1. **Given** a new developer joins the project, **When** they read this map, **Then** they understand that `pos.Api` is the backend and `pos-ui` is the frontend.
2. **Given** a requirement for a full-stack feature, **When** planning, **Then** developers know which directories to modify.

---

### User Story 2 - Backend Structure (Priority: P1)

As a backend developer, I need to know where the API logic resides.

**Why this priority**: Critical for backend maintenance and feature development.

**Independent Test**: Verify that the `pos.Api` directory contains the ASP.NET Core solution.

**Acceptance Scenarios**:

1. **Given** I need to modify an endpoint, **When** I look for the code, **Then** I find it in `w:\WEB\sales\pos.Api`.

---

### User Story 3 - Frontend Structure (Priority: P1)

As a frontend developer, I need to know where the UI logic resides.

**Why this priority**: Critical for frontend maintenance and UI development.

**Independent Test**: Verify that the `pos-ui` directory contains the Angular application.

**Acceptance Scenarios**:

1. **Given** I need to adding a new page, **When** I look for the code, **Then** I find it in `w:\WEB\sales\pos-ui`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST be structured as a Monorepo containing both Backend and Frontend.
- **FR-002**: The Backend (API) MUST be located in `pos.Api` (ASP.NET Core).
- **FR-003**: The Frontend (UI) MUST be located in `pos-ui` (Angular).
- **FR-004**: The documentation MUST describe the relationship: The Frontend consumes the Backend API via HTTP/REST.

### Key Entities _(include if feature involves data)_

- **Backend (API)**: The server-side application (ASP.NET Core) responsible for business logic, database interactions, and authentication.
- **Frontend (UI)**: The client-side application (Angular) responsible for user interaction and presenting data fetched from the API.
  - **UI Library**: **PrimeNG** must be used for all UI components (e.g., `p-table` for tables, `p-dialog` for modals, `p-button` for buttons).
  - **Styling**: **Tailwind CSS** must be used for layout and utility classes (e.g., `flex`, `grid`, `p-4`, `text-center`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can identify the root folders for API and UI within 5 seconds of viewing the project root.
- **SC-002**: Architectural separation is maintained; no frontend code in backend folders and vice versa.
- **SC-003**: New features can be specified in terms of "Backend Changes" and "Frontend Changes" clearly referring to these two distinct areas.
