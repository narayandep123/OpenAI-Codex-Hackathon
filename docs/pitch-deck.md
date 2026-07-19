# SurgiFind Pitch Deck

## Slide 1: Title
**SurgiFind**

Find the right hospital for surgery with clarity on price, insurance, and booking.

One-line pitch:
SurgiFind helps patients discover surgical care faster by combining hospital search, price comparison, insurance matching, and guided booking in one platform.

Presenter note:
Healthcare decisions around surgery are high-stress, high-cost, and time-sensitive. SurgiFind reduces that friction with a patient-first discovery and booking experience.

## Slide 2: Problem
**Patients struggle to make informed surgery decisions**

- Hospital discovery is fragmented across search engines, aggregators, and hospital websites.
- Price transparency is poor, so families cannot compare likely costs with confidence.
- Insurance network and coverage checks are confusing and time-consuming.
- Booking a consultation or surgery often requires multiple manual calls and follow-ups.

Presenter note:
The current experience is reactive and opaque. People do not just need a list of hospitals. They need clarity, comparison, and a trusted next step.

## Slide 3: Solution
**A surgery discovery and booking layer built for patients**

SurgiFind brings together:

- hospital and surgery search
- cost range comparison
- insurance plan matching
- conversational guidance
- authenticated booking and booking history

Presenter note:
Instead of making users jump between multiple systems, SurgiFind gives them a guided path from intent to action.

## Slide 4: Product Demo Flow
**How a user moves through SurgiFind**

1. Search by surgery, city, budget, rating, or hospital type.
2. Compare hospitals with price ranges and availability.
3. Ask the chat assistant in natural language for recommendations.
4. Review insurance plan matches.
5. Book a consultation or surgery slot securely.
6. Track or cancel the booking from booking history.

Presenter note:
The important point is not just discovery. It is continuity. Search, guidance, insurance, and booking all sit in one flow.

## Slide 5: Key Features
**What makes the product useful today**

- Smart surgery search with filters for city, budget, rating, and hospital type
- Conversational assistant with direct search and symptom-assisted guidance
- Insurance matching against covered surgeries and network hospitals
- Secure authentication with booking history
- Slot reservation flow with cancellation support

Presenter note:
This is not just a static directory. It is a functional marketplace experience with real user actions.

## Slide 6: Why It Stands Out
**SurgiFind is differentiated by workflow depth**

Most solutions focus on one layer only:

- discovery only
- content only
- hospital website only
- insurance lookup only

SurgiFind combines all four:

- search
- guided decision support
- insurance relevance
- booking execution

Presenter note:
The strength of the product is the connected journey. That is where patient confidence improves.

## Slide 7: Technology and Trust
**Built for speed now, designed for stronger production controls next**

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Next.js route handlers
- Data and Auth: Supabase Auth + PostgreSQL
- AI assistant: OpenAI-backed conversational guidance with rule-based fallbacks
- Security baseline: authenticated booking flow, row-level access controls, server-side writes for sensitive operations

Presenter note:
We optimized for hackathon execution, but the architecture already separates public browsing from protected booking operations.

## Slide 8: Business Potential
**A platform that can serve both patients and providers**

Potential revenue paths:

- lead generation fees from hospitals
- premium listing or sponsored discovery placement
- booking conversion commissions
- insurance partnership and referral workflows
- care navigation subscriptions for high-intent users

Presenter note:
The near-term value is lead conversion and patient acquisition. Over time, SurgiFind can become a navigation layer across elective and planned care journeys.

## Slide 9: Go-To-Market
**Start where intent is strongest**

- Focus on high-consideration elective surgeries first
- Target urban patients comparing providers across price bands
- Partner with hospitals that want qualified inbound demand
- Use SEO, conversational search, and referral partnerships to capture intent

Presenter note:
Users searching for surgery options already have strong intent. The opportunity is to help them convert with better information and lower friction.

## Slide 10: Next Steps
**What we would build after the hackathon**

- Payment system for consultation deposits and surgery booking confirmation
- Production cloud deployment with managed CI/CD, secrets handling, and monitoring
- Database-level transactional booking workflow for stronger consistency
- Doctor-level scheduling and richer hospital-side operations
- Rate limiting, WAF, audit trails, and production security hardening
- More hospital and insurance integrations

Presenter note:
The current product proves the workflow. The next step is making it operationally stronger, financially complete, and ready for larger-scale usage.

## Slide 11: Long-Run Architecture
**From working prototype to production healthcare platform**

Core additions for scale:

- Global edge delivery and CDN
- Load balancer and autoscaled application runtime
- API management for traffic policies and versioned APIs
- Cache layer for catalog search and frequent reads
- Background jobs for notifications, reconciliation, and reporting
- Security controls including WAF, secrets management, and audit logging

Presenter note:
This is the bridge from hackathon prototype to resilient product. The application stays the same conceptually, but the platform gains control planes for scale, security, and reliability.

## Slide 12: Team
**Built by a product-minded engineering team**

- Aditi Prasad
- Mayank Prasad
- Deepnarayan Lohra

Strengths:

- product thinking
- full-stack engineering
- AI-assisted workflow design
- data-backed healthcare discovery experience

Presenter note:
We built this end-to-end ourselves, from search and chat to booking and deployment.

## Slide 13: Closing
**SurgiFind makes surgery discovery transparent and patient-first**

Closing line:
When patients need surgery, they should not have to navigate cost, trust, insurance, and booking alone. SurgiFind gives them one place to decide and act.

Optional ask:

- pilot hospital partners
- product feedback
- healthcare domain mentors
- early users for usability testing

## Optional Slide: Deployment Model
**Suggested production deployment path**

- Frontend and server routes on Vercel
- Supabase for auth and primary transactional data
- Managed Redis for caching and rate limits
- API gateway or edge controls for request governance
- Monitoring stack for logs, uptime, traces, and alerting

Presenter note:
This path keeps velocity high while introducing production controls in layers instead of rebuilding the system from scratch.

## Optional Slide: Demo Talking Points
Use these if you are presenting live while clicking through the app.

1. Start on the landing page and frame the problem.
2. Show surgery search with filters and explain price transparency.
3. Open a hospital detail page and explain the booking flow.
4. Use the chatbot to show natural-language discovery.
5. Show insurance matching.
6. Complete a booking and then open My Bookings.
7. Show cancellation and explain continuity of the workflow.

## Optional Slide: Metrics Placeholders
Add these only if you have real numbers.

- Number of hospitals in the dataset: [fill in]
- Number of surgeries covered: [fill in]
- Number of insurance plans mapped: [fill in]
- Time reduced in shortlist creation: [fill in]
- Demo bookings completed: [fill in]

Do not present estimated or invented traction as fact.