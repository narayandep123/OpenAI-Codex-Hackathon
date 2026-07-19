# SurgiFind Architecture Diagram

![SurgiFind Architecture Flow](./architecture-diagram.svg)

PNG version: [architecture-diagram.png](architecture-diagram.png)

## High-Level Flow

```mermaid
flowchart TB
  U[User Browser]
  UI[Next.js App Router UI\n/src/app + /src/components]
  AUTH[Supabase Auth]
  API[Route Handlers\n/src/app/api]
  LIB[Shared Server Logic\n/src/lib]
  DB[(Supabase PostgreSQL)]
  AI[OpenAI]

  U --> UI
  UI --> AUTH
  UI --> API
  API --> LIB
  LIB --> DB
  API --> DB
  API --> AI
  AUTH --> DB
```

## Request Flow by Feature

```mermaid
flowchart LR
  subgraph Frontend[Frontend]
    Home[Landing Page]
    SearchPage[Search Page]
    HospitalPage[Hospital Detail Page]
    ChatPage[Chat Page]
    InsurancePage[Insurance Page]
    BookingsPage[My Bookings Page]
    Modal[Booking Modal]
  end

  subgraph Backend[Backend]
    SearchAPI[/api/search/]
    ChatAPI[/api/chat/]
    BookAPI[/api/book/]
  end

  subgraph Services[Shared Services]
    SearchLib[src/lib/search.ts]
    SupabaseServer[Supabase Server Client]
    SupabaseAdmin[Supabase Admin Client]
    SupabaseBrowser[Supabase Browser Client]
  end

  subgraph Data[Supabase Data Layer]
    Hospitals[(hospitals)]
    Surgeries[(surgeries)]
    Insurance[(insurance_plans)]
    HospitalSurgeries[(hospital_surgeries)]
    Slots[(hospital_slots)]
    Bookings[(bookings)]
  end

  Home --> SearchPage
  SearchPage --> SearchAPI
  HospitalPage --> Modal
  Modal --> BookAPI
  ChatPage --> ChatAPI
  InsurancePage --> SearchLib
  BookingsPage --> SupabaseServer

  SearchAPI --> SearchLib
  ChatAPI --> SearchLib
  BookAPI --> SupabaseServer
  SearchLib --> SupabaseAdmin
  SearchLib --> Hospitals
  SearchLib --> Surgeries
  SearchLib --> Insurance
  SearchLib --> HospitalSurgeries
  SearchLib --> Slots
  BookAPI --> Slots
  BookAPI --> Bookings
  SupabaseBrowser --> Frontend
```

## Booking Sequence

```mermaid
sequenceDiagram
  participant User
  participant UI as Booking Modal
  participant API as /api/book
  participant Auth as Supabase Auth
  participant DB as Supabase DB

  User->>UI: Fill patient and slot details
  UI->>API: POST booking request
  API->>Auth: Verify signed-in user
  Auth-->>API: User session
  API->>DB: Check hospital, surgery, and slot
  API->>DB: Reserve slot (is_available = false)
  API->>DB: Insert booking row
  DB-->>API: Booking confirmation
  API-->>UI: Confirmation payload
  UI-->>User: Show success card
```

## Main Design Decisions
- Next.js App Router handles both UI and server routes in one codebase.
- Supabase stores auth, catalog, slots, and bookings.
- Server-side data access is centralized in src/lib/search.ts.
- Booking writes are protected by session validation and server-side Supabase access.
- The chat assistant can use OpenAI, but falls back to deterministic rules when needed.

## File Map
- [src/app](../src/app)
- [src/components](../src/components)
- [src/lib](../src/lib)
- [src/app/api/book/route.ts](../src/app/api/book/route.ts)
- [src/app/api/chat/route.ts](../src/app/api/chat/route.ts)
- [src/app/api/search/route.ts](../src/app/api/search/route.ts)
- [src/lib/search.ts](../src/lib/search.ts)
- [src/lib/supabase](../src/lib/supabase)
