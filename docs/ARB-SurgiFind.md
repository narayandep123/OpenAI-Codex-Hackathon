# ARB Document: SurgiFind

## 1. Document Control
- Project: SurgiFind
- Type: Architecture Review Board (ARB)
- Version: 1.0
- Date: 2026-07-18
- Owner: SurgiFind Engineering Team
- Status: Draft for Review

## 2. Executive Summary
SurgiFind is a healthcare marketplace web application that helps users discover hospitals for surgeries, compare pricing and insurance, chat with an assistant, and book consultation or surgery slots. The app is built with Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase for authentication and persistence.

The architecture is optimized for hackathon speed while preserving production-oriented fundamentals:
- Server-side data access
- Authenticated booking flow
- Row-level controls for user bookings
- API-driven domain operations

## 3. Business Goals and Scope
### In Scope
- Hospital and surgery discovery
- Search filters and recommendations
- Conversational assistant (direct search + symptom assistance)
- Authenticated booking and booking history
- Insurance plan discovery

### Out of Scope (Current)
- Payment processing
- EHR/EMR integration
- Doctor-level scheduling
- Clinical diagnosis workflow

## 4. Architecture Overview
### Frontend
- Framework: Next.js (App Router), React, TypeScript
- Styling: Tailwind CSS
- UX: Responsive pages, dialog-based booking, floating chat launcher

### Backend
- Next.js Route Handlers:
  - /api/search
  - /api/chat
  - /api/book

### Data and Identity
- Supabase Auth for sign-in/sign-up and session handling
- Supabase PostgreSQL for:
  - hospitals
  - surgeries
  - insurance_plans
  - hospital_surgeries
  - hospital_slots
  - bookings

### External AI
- OpenAI integration for conversational assistant intent classification and response generation with fallbacks.

## 5. Logical Component Design
### UI Layer
- Landing, search, hospital detail, insurance, chat, and bookings pages
- Booking modal in hospital detail page

### Domain Services
- Search service utilities in src/lib/search.ts
- Booking orchestration in /api/book route
- Chat orchestration in /api/chat route

### Infrastructure Services
- Supabase browser client for client auth state
- Supabase server client for session-aware user checks
- Supabase admin client for trusted server-side catalog reads/writes where needed
- Middleware for session refresh

## 6. Data Model Summary
### Core Entities
- hospitals: Hospital metadata
- surgeries: Master surgery catalog and benchmark price bounds
- hospital_surgeries: Surgery availability and price ranges per hospital
- hospital_slots: Bookable slots with availability flag
- insurance_plans: Coverage and network mappings
- bookings: User bookings, booking status, estimated cost, timestamps

### Booking Flow Data Rules
- A slot is reserved by changing is_available from true to false.
- Booking insert occurs after slot reservation.
- If booking insert fails, slot reservation is rolled back.

## 7. Runtime Flow
### Search
1. User submits filters.
2. /api/search validates query and resolves candidates from catalog.
3. Results returned to UI.

### Booking
1. Authenticated user submits booking form.
2. /api/book validates payload and business rules.
3. Slot reservation update is attempted.
4. Booking row is inserted.
5. Confirmation payload is returned.

### Chat
1. User sends message to /api/chat.
2. Intent classification selects direct search, symptom-assisted path, emergency guardrails, or general response.
3. Structured response with optional suggestions/cards is returned.

## 8. Security and Compliance Posture
### Implemented
- Supabase Auth session validation on protected operations
- RLS policies on bookings to isolate user data
- Server-side writes for sensitive booking operations
- Input validation on API routes

### Current Risks
- Service role key usage is powerful and must remain server-only.
- Public catalog visibility policy/grant settings require careful review.
- Exposed secrets during debugging must be rotated.

### Required Immediate Actions
- Rotate OPENAI_API_KEY.
- Rotate SUPABASE_SERVICE_ROLE_KEY.
- Confirm service-role key is not exposed to browser bundles.

## 9. Scalability and Reliability
### Strengths
- Clear separation of UI and API responsibilities
- Supabase-backed persistent storage
- Centralized search/data access layer

### Constraints
- Slot reservation and booking insert are not yet wrapped in a DB transaction function.
- Some reads currently rely on admin client due to anon visibility issues.

### Near-Term Improvements
- Move booking reserve+insert into a Postgres function for stronger atomicity.
- Introduce caching strategy for catalog reads.
- Add observability for API failures and booking conversion funnel.

## 10. Deployment and Operations
- Target platform: Vercel
- Build: next build
- Runtime secrets: .env.local in dev, platform env vars in prod
- Seed process: scripts/seed-supabase.js

### Operational Checklist
- Validate all required env vars in each environment.
- Run seed and verify row counts.
- Smoke-test routes: /, /search, /hospital/[id], /insurance, /chat, /bookings.

## 11. Testing Strategy
### Current
- Build-time TypeScript and Next.js compile validation.

### Recommended
- API integration tests for /api/book and /api/chat.
- E2E tests for sign-in -> booking -> my bookings.
- Regression tests for slot contention behavior.

## 12. Decisions and Rationale
1. Next.js App Router selected for full-stack velocity and server rendering support.
2. Supabase selected for rapid auth + Postgres integration.
3. Booking logic placed in server route handlers to enforce server-side control.
4. Admin client introduced to restore data visibility while anon policy configuration is being stabilized.

## 13. Open Issues
- Finalize anon/authenticated read strategy for public catalog tables.
- Tighten least-privilege data access in non-hackathon environment.
- Add explicit audit logging for booking state transitions.

## 14. Approval
- ARB Reviewer: Pending
- Product Owner: Pending
- Engineering Lead: Pending
