# Intake — Event Management Engineering Contract

**Module Name:** Event Management  
**Module Code:** OPS-EVT  
**Functional Lane:** Lane A — Operations  
**Version:** 1.0  
**Contract Status:** Proposed / Demo Implementation  
**Prepared By:** Khushboo — Team Lead  
**Development Model:** From-Scratch Demo Build  

---

# 1. Purpose

The Event Management module provides a centralized system for creating,
scheduling, publishing, viewing and managing institutional events.

The approved product requirements are:

- RSVP
- Event scheduling
- Resource booking
- Integration with existing event/gallery functionality

This implementation is being developed as a demo implementation under the
common WisWits engineering architecture.

After completion, it may be compared and reconciled with the existing Event /
Calendar / Gallery implementation before final product integration.

---

# 2. Architecture

All development must follow the approved WisWits architecture.

Frontend:

Next.js 16  
React 19  
Tailwind CSS 4

Backend:

Node.js  
Express 5

Database:

MariaDB  
mysql2  
Parameterized SQL  
No ORM

System flow:

User
→ Next.js Frontend
→ REST API
→ Express Backend
→ Business Logic
→ MariaDB
→ API Response
→ Frontend

The frontend must never directly access MariaDB.

---

# 3. Module Scope

## In Scope

- Event Dashboard
- Event List
- Event Details
- Event Calendar
- Create Event
- Edit Event
- Event Scheduling
- Event Status
- Search
- Filters
- RSVP
- RSVP Summary
- Attendee View
- Resource Management
- Resource Availability
- Resource Booking
- Resource Conflict Detection
- Event/Gallery integration point
- Responsive UI
- Loading states
- Empty states
- Error states
- Permission-aware actions

## Out of Scope for Initial Demo

- Payment gateway
- Paid event ticketing
- External event marketplace
- Public ticket sales
- Native mobile application
- Advanced event analytics
- Unapproved third-party event services

Any additional business feature requires discussion before implementation.

---

# 4. Proposed Users

Possible users include:

| User | Responsibility |
|---|---|
| Administrator | Full Event Management access |
| Event Manager / Authorized Staff | Create and manage events |
| Teacher / Staff | View and RSVP where permitted |
| Student | View eligible events and RSVP where permitted |

Final permissions must follow the platform RBAC system.

Roles must not be hardcoded where the existing permission system can be used.

---

# 5. Proposed Event Lifecycle

Event lifecycle:

DRAFT
→ SCHEDULED
→ PUBLISHED
→ COMPLETED

Alternative terminal state:

CANCELLED

Draft events should not be visible to normal attendees.

Only authorized users may create, publish, modify or cancel events.

---

# 6. Main User Flow

Authorized User
→ Opens Event Management
→ Views Dashboard
→ Selects Create Event
→ Completes Event Form
→ Selects Date / Time
→ Selects Location
→ Configures RSVP
→ Selects Resources if required
→ Submits
→ Frontend validates
→ API request sent
→ Backend validates
→ Resource conflicts checked
→ MariaDB operation
→ Standard API response
→ Frontend displays result

---

# 7. RSVP Flow

Eligible User
→ Opens Published Event
→ Views Event Details
→ Selects RSVP
→ Going / Maybe / Not Going
→ Frontend sends API request
→ Backend validates user and event
→ RSVP saved
→ Backend returns response
→ UI displays updated RSVP status

Authorized management users may view RSVP summaries.

---

# 8. Resource Booking Flow

Authorized User
→ Create/Edit Event
→ Select Resource
→ Select Required Time
→ Request Availability
→ Backend checks bookings

If Available:

Resource
→ Book
→ Link Booking to Event
→ Success

If Unavailable:

Resource
→ Conflict Response
→ UI displays conflict
→ User changes resource/time

---

# 9. Module Blueprint

## 9.1 Frontend Scope

Frontend must implement:

- Event Dashboard
- Event List
- Event Details
- Event Calendar
- Create Event
- Edit Event
- Event Form
- Search
- Filters
- RSVP interface
- RSVP summary
- Attendee interface
- Resource list
- Resource availability
- Resource booking
- Required actions/buttons
- Loading states
- Empty states
- Error states
- Success feedback
- Responsive behaviour

Frontend developers may add suitable UI improvements and reusable components
provided they do not change the API contract, architecture or approved module
scope.

---

## 9.2 Backend Scope

Backend must implement:

- Event routes
- Event APIs
- RSVP APIs
- Resource APIs
- Resource booking APIs
- Request validation
- Event lifecycle validation
- Business logic
- Authentication integration
- Authorization
- Tenant isolation
- Search/filter handling
- Resource conflict detection
- Standard API responses
- Error handling
- MariaDB communication

Backend developers may improve internal implementation where appropriate,
but must not independently change approved endpoint names, request fields or
response structures.

---

## 9.3 Database Scope

Database responsibilities:

- Event data structure
- RSVP data structure
- Resource data structure
- Resource booking structure
- Relationships
- Foreign keys where appropriate
- Required indexes
- Tenant isolation
- Data integrity
- Migration
- MariaDB compatibility

The database implementation must support the approved backend/API contract.

---

## 9.4 Integration Scope

Required integration chain:

Frontend
→ API Contract
→ Express Backend
→ MariaDB
→ Backend Response
→ Frontend

The module may later require reconciliation/integration with:

- Existing Events implementation
- Existing Calendar
- Existing Gallery
- Authentication
- RBAC
- Tenant middleware
- Audit infrastructure
- Platform navigation
- Module registration

---

# 10. Frontend Modular Structure

Event Management must exist inside the approved frontend architecture.

Conceptual module structure:

event-management/
│
├── dashboard/
├── events/
├── calendar/
├── rsvp/
├── resources/
│
├── components/
│   ├── EventCard
│   ├── EventTable
│   ├── EventForm
│   ├── EventFilters
│   ├── RSVPPanel
│   ├── AttendeeList
│   ├── ResourceSelector
│   └── ResourceBookingForm
│
└── API / service integration

The exact physical root must follow the Master Architecture.

Developers must not create a separate React/Next.js project for Event
Management.

---

# 11. Backend Modular Structure

Event Management backend functionality must remain inside the approved Express
backend architecture.

Conceptual structure:

event-management/
│
├── routes
├── controllers / handlers
├── services
├── validation
└── database/query layer

Responsibilities may be split between backend developers, but both developers
are building ONE Event Management backend.

They must not create separate backend applications.

---

# 12. Frontend Pages

## Event Dashboard

Display suitable summary information such as:

- Upcoming Events
- Draft Events
- Published Events
- Completed Events
- Upcoming Event Preview
- Quick Create Event

Developers may improve dashboard presentation while preserving the common
WisWits design language.

---

## Event List

Required capabilities:

- Event listing
- Search
- Status filtering
- Date filtering
- Category filtering where implemented
- View action
- Edit action where permitted
- Create Event action

---

## Create / Edit Event

Proposed fields:

- Title
- Description
- Category
- Start Date/Time
- End Date/Time
- Location
- Audience
- RSVP Enabled
- RSVP Deadline
- Capacity
- Required Resources
- Status
- Media/Cover reference where applicable

---

## Event Details

Display:

- Event title
- Description
- Date/time
- Location
- Status
- RSVP information
- Resource information
- Media/gallery area where applicable
- RSVP action
- Management actions where permitted

---

# 13. API Contract

Proposed base route:

`/api/v1/events`

---

## GET Events

**Method**

GET

**Endpoint**

`/api/v1/events`

Optional query parameters:

- search
- status
- startDate
- endDate
- page
- limit

Example response:

{
  "success": true,
  "data": {
    "events": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0
    }
  }
}

---

## GET Event Details

GET

`/api/v1/events/:eventId`

Example response:

{
  "success": true,
  "data": {
    "event": {}
  }
}

---

## CREATE Event

POST

`/api/v1/events`

Example request:

{
  "title": "Annual Cultural Fest",
  "description": "Annual school cultural event",
  "category": "cultural",
  "startAt": "2026-08-10T09:00:00",
  "endAt": "2026-08-10T16:00:00",
  "location": "Main Auditorium",
  "rsvpEnabled": true,
  "rsvpDeadline": "2026-08-08T23:59:59",
  "capacity": 500
}

Example response:

{
  "success": true,
  "data": {
    "event": {}
  }
}

---

## UPDATE Event

PATCH

`/api/v1/events/:eventId`

Only approved fields may be updated.

---

## UPDATE Event Status

PATCH

`/api/v1/events/:eventId/status`

Example:

{
  "status": "cancelled"
}

Cancellation is preferred over destructive deletion for published events with
related records.

---

# 14. RSVP API Contract

## Submit / Update RSVP

PUT

`/api/v1/events/:eventId/rsvp`

Request:

{
  "response": "going"
}

Allowed proposed values:

- going
- maybe
- not_going

Response:

{
  "success": true,
  "data": {
    "eventId": 1,
    "response": "going"
  }
}

---

## Get Event RSVPs

GET

`/api/v1/events/:eventId/rsvps`

Example:

{
  "success": true,
  "data": {
    "summary": {
      "going": 0,
      "maybe": 0,
      "notGoing": 0
    },
    "attendees": []
  }
}

Management permission is required.

---

# 15. Resource API Contract

## Get Resources

GET

`/api/v1/events/resources`

---

## Check Resource Availability

GET

`/api/v1/events/resources/:resourceId/availability`

Query:

- startAt
- endAt

---

## Book Resource

POST

`/api/v1/events/:eventId/resources`

Request:

{
  "resourceId": 1,
  "startAt": "2026-08-10T09:00:00",
  "endAt": "2026-08-10T16:00:00"
}

Backend must reject conflicting bookings.

---

## Remove Booking

DELETE

`/api/v1/events/:eventId/resources/:bookingId`

---

# 16. Standard Error Contract

Example:

{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "The selected resource is unavailable for this time."
  }
}

Possible errors:

- EVENT_NOT_FOUND
- EVENT_VALIDATION_FAILED
- EVENT_PERMISSION_DENIED
- RSVP_CLOSED
- RSVP_DISABLED
- EVENT_CAPACITY_REACHED
- RESOURCE_NOT_FOUND
- RESOURCE_CONFLICT

Database/SQL errors must never be exposed directly to the frontend.

---

# 17. MariaDB Demo Design

IMPORTANT:

The authoritative technical documentation describes Event Management as
extending existing Event/Gallery data.

However, this implementation is being built from scratch as a DEMO according
to the latest team direction.

Therefore, the following database design is PROPOSED FOR THE DEMO and must be
reconciled with the existing production data model before production
integration.

Proposed entities:

Event
Event RSVP
Event Resource
Event Resource Booking

---

## Event

Proposed demo table:

`client_events_demo`

Fields:

- id
- org_id
- title
- description
- category
- start_at
- end_at
- location
- capacity
- rsvp_enabled
- rsvp_deadline
- status
- created_by
- created_at
- updated_at

---

## Event RSVP

Proposed demo table:

`client_event_rsvps_demo`

Fields:

- id
- org_id
- event_id
- user_id
- response
- responded_at
- created_at
- updated_at

Rule:

One RSVP per user/event.

Suggested unique constraint:

(org_id, event_id, user_id)

---

## Event Resource

Proposed demo table:

`client_event_resources_demo`

Fields:

- id
- org_id
- name
- description
- resource_type
- location
- capacity
- is_active
- created_at
- updated_at

---

## Event Resource Booking

Proposed demo table:

`client_event_resource_bookings_demo`

Fields:

- id
- org_id
- event_id
- resource_id
- start_at
- end_at
- created_by
- created_at
- updated_at

Backend must detect overlapping bookings.

---

# 18. Database Relationships

Event
1 → Many
RSVP

Event
1 → Many
Resource Booking

Resource
1 → Many
Resource Booking

User
1 → Many
RSVP

Tenant-owned data must remain organization scoped.

---

# 19. Proposed Indexes

Event:

(org_id, start_at)

Event:

(org_id, status)

RSVP:

UNIQUE (org_id, event_id, user_id)

RSVP:

(org_id, event_id)

Resource:

(org_id, is_active)

Resource Booking:

(org_id, resource_id, start_at, end_at)

---

# 20. Database Rules

Database implementation must:

- Use MariaDB
- Use mysql2
- Use parameterized SQL
- Preserve org_id tenant isolation
- Maintain data integrity
- Use approved migrations
- Use appropriate indexes
- Never hardcode credentials
- Never introduce an ORM
- Never allow frontend direct DB access

---

# 21. Permissions

Existing Event permissions should be reused where available.

If suitable permissions do not already exist, proposed permissions are:

- events.rsvp
- events.manage

Frontend visibility is NOT authorization.

Backend must enforce permissions.

---

# 22. Mock Data Contract

Frontend developers may use mock data while backend implementation is underway.

Mock data MUST use the same fields and response structures defined in this
contract.

Example:

Mock API Response
→ Frontend Development
→ Real API becomes available
→ Replace Mock API
→ UI remains structurally unchanged

Frontend developers must not invent a different data model.

---

# 23. Team Assignment

## Khushboo — Team Lead + MariaDB

Responsibilities:

- Own module contract
- Architecture coordination
- MariaDB design
- Migration
- Relationships
- Indexes
- Tenant isolation
- Contract decisions
- Git coordination
- PR review
- Integration
- Testing
- Correction assignment
- Final merge approval

---

## Sunidhi — Frontend Developer 1

Primary area:

Event discovery/viewing.

Required work:

- Event Dashboard
- Event List
- Event Details
- Event Calendar
- Search
- Filters
- Loading states
- Empty states
- Error states
- Responsive implementation

Assigned branch:

`feature/event-frontend-sunidhi`

---

## Ankit — Frontend Developer 2

Primary area:

Event management/interactions.

Required work:

- Create Event
- Edit Event
- Event Form
- RSVP UI
- RSVP Status
- Attendee UI
- Resource selection
- Resource availability UI
- Resource booking UI
- Form validation
- Suitable reusable Event components

Assigned branch:

`feature/event-frontend-ankit`

---

## Neha — Backend Developer 1

Primary area:

Core Event backend.

Required work:

- Event routes
- GET events
- GET event details
- POST event
- PATCH event
- Event status endpoint
- Event validation
- Search/filter support
- Permission enforcement
- Tenant-scoped queries
- Standard responses
- Error handling

Assigned branch:

`feature/event-backend-neha`

---

## Jatin — Backend Developer 2

Primary area:

RSVP + Resources.

Required work:

- RSVP endpoint
- RSVP update
- RSVP summary
- RSVP validation
- Resource endpoints
- Availability endpoint
- Resource booking
- Resource booking removal
- Conflict detection
- Permission enforcement
- Tenant-scoped queries
- Standard responses

Assigned branch:

`feature/event-backend-jatin`

---

# 24. Developer Flexibility

Developers are encouraged to contribute useful implementation ideas.

They MAY:

- Improve internal code organization within their assigned scope
- Build reusable components
- Improve accessibility
- Improve responsive behaviour
- Improve UX
- Suggest additional validation
- Suggest useful module features
- Suggest better implementation approaches

However:

Any change affecting:

- API contracts
- Database schema
- Technology stack
- Shared architecture
- Authentication
- Permissions
- Tenant isolation
- Shared/global components
- Module scope

must be discussed with the Team Lead before implementation.

Do not silently change the contract.

---

# 25. Git Workflow

Stable branch:

`main`

Developers do NOT develop directly on main.

Developer workflow:

main
→ assigned feature branch
→ development
→ local testing
→ commit
→ push
→ Pull Request
→ Team Lead review
→ integration
→ correction if necessary
→ approval
→ merge

Assigned branches:

Sunidhi:
`feature/event-frontend-sunidhi`

Ankit:
`feature/event-frontend-ankit`

Neha:
`feature/event-backend-neha`

Jatin:
`feature/event-backend-jatin`

Khushboo database work:
`feature/event-database-khushboo`

---

# 26. Integration Flow

Next.js Frontend
↓
Event API
↓
Express Routes
↓
Authentication
↓
Authorization
↓
Tenant Context
↓
Business Logic
↓
mysql2 Parameterized SQL
↓
MariaDB
↓
Standard Response
↓
Frontend State Update

---

# 27. Integration Checklist

## Frontend

- [ ] Dashboard works
- [ ] Event List works
- [ ] Search works
- [ ] Filters work
- [ ] Calendar works
- [ ] Create Event works
- [ ] Edit Event works
- [ ] Event Details works
- [ ] RSVP UI works
- [ ] Resource UI works
- [ ] Responsive UI checked
- [ ] Loading state
- [ ] Empty state
- [ ] Error state

## Backend

- [ ] Event APIs work
- [ ] RSVP APIs work
- [ ] Resource APIs work
- [ ] Validation works
- [ ] Permission checks work
- [ ] Tenant isolation works
- [ ] Standard responses match
- [ ] SQL is parameterized
- [ ] Errors are handled

## Database

- [ ] MariaDB connection works
- [ ] Migration works
- [ ] Tables/approved demo structures work
- [ ] Relationships work
- [ ] Indexes exist
- [ ] org_id exists where required
- [ ] Duplicate RSVP prevented
- [ ] Resource conflicts handled
- [ ] Data persists correctly

## End-to-End

- [ ] Frontend connects to backend
- [ ] Backend connects to MariaDB
- [ ] Request fields match contract
- [ ] Response fields match contract
- [ ] Create Event works end-to-end
- [ ] Event List works end-to-end
- [ ] Event Details work end-to-end
- [ ] RSVP works end-to-end
- [ ] Resource booking works end-to-end
- [ ] Error states work
- [ ] Permission failures behave correctly

---

# 28. Acceptance Criteria

Event Management demo is integration-ready when:

1. Authorized users can create and manage events.
2. Events can be scheduled.
3. Events can be viewed through list/detail/calendar interfaces.
4. Eligible users can RSVP.
5. RSVP data persists correctly.
6. Authorized users can review RSVP information.
7. Resources can be viewed.
8. Resources can be booked.
9. Conflicting resource bookings are rejected.
10. Frontend/backend/MariaDB operate together.
11. API contracts match.
12. Tenant isolation is preserved.
13. Permissions are enforced server-side.
14. Required UI states exist.
15. Responsive behaviour is verified.
16. Integration testing passes.
17. Pull Requests are reviewed.
18. Required corrections are completed.

---

# 29. Demo Reconciliation

After completion:

New Demo
↓
Compare with Existing Event Implementation
↓
Review UI
↓
Review APIs
↓
Review Database Compatibility
↓
Review Existing Gallery/Calendar Integration
↓
Identify Best/Re-usable Parts
↓
Technical Decision
↓
REUSE / PORT / MERGE / REPLACE

The demo database must NOT automatically replace an existing production
Event table.

---

# 30. Development Boundaries

Developers must not independently:

- Change the technology stack
- Introduce another database
- Introduce an ORM
- Change API contracts
- Change approved request/response fields
- Remove tenant isolation
- Hardcode org_id
- Modify unrelated modules
- Modify global architecture without approval
- Commit secrets
- Connect frontend directly to MariaDB
- Add unrelated features

---

# 31. Daily Engineering Review

At the daily alignment meeting review:

1. What was completed?
2. What is still pending?
3. What failed?
4. What is blocked?
5. What requires correction?
6. What is the next priority?

Code is NOT merged simply because the day has ended.

Merge only after:

Frontend ✓
Backend ✓
Database ✓
Contract Match ✓
Integration ✓
Testing ✓
Review ✓

---

# 32. Core Rule

Build to the contract.

Developers may improve implementation inside their assigned boundaries,
but must not redesign the architecture independently.

If a useful feature or architectural improvement is identified, propose it to
the Team Lead before changing the shared contract.