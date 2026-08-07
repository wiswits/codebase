# Intake — Alumni Directory Module

## Overview

The Alumni Directory module is a standalone WisWits SaaS module for viewing, searching, filtering, and exploring alumni records.

The module was developed from scratch and assembled from independently developed frontend and backend contributions before final integration.

The final implementation uses real API and database connectivity rather than frontend mock data.

---

## Module Status

Status: Integrated and Tested

Completed areas:

- Alumni Dashboard
- Alumni Directory
- Alumni Search
- Batch Filtering
- Graduation Year Filtering
- Course Filtering
- Filter Reset
- Table View
- Grid View
- Alumni Profile
- Alumni Statistics
- Batch Overview
- Loading States
- Empty States
- Error States
- Responsive Layout
- Frontend / Backend Integration
- Backend / Database Integration

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Next.js App Router
- Lucide React

### Backend

- Node.js
- Express.js
- ES Modules
- REST API architecture
- Controller / Service / Repository layering

### Database

- MariaDB
- Parameterized SQL queries
- Tenant-aware `org_id` structure
- Indexed relational schema

---

## Project Structure

final/

    frontend/
        app/
        src/
            components/
            modules/alumni/

    backend/
        src/
            config/
            modules/alumni/
                controllers/
                repositories/
                services/

    database/
        SQL / migration files

---

## Frontend Routes

/alumni
Alumni dashboard

/alumni/directory
Searchable and filterable alumni directory

/alumni/[id]
Dynamic alumni profile

---

## Backend API

Base URL:

http://localhost:5000/api/v1

Available Alumni APIs include:

GET /alumni
Returns alumni directory records.

GET /alumni/:id
Returns an individual alumni profile.

GET /alumni/stats
Returns alumni statistics.

GET /alumni/batches
Returns alumni batch information.

Health endpoint:

GET /health

---

## Environment Configuration

Frontend environment example:

NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

Backend database configuration must be supplied using the backend environment variables.

Actual `.env` and `.env.local` files must not be committed.

Use the provided `.env.example` files as configuration templates.

---

## Running the Backend

Navigate to:

final/backend

Install dependencies:

npm install

Start the backend:

npm start

Expected local backend:

http://localhost:5000

---

## Running the Frontend

Navigate to:

final/frontend

Install dependencies:

npm install

Start development mode:

npm run dev

Frontend:

http://localhost:3000

Production verification:

npm run build
npm start

---

## Data Flow

MariaDB
    ↓
Repository Layer
    ↓
Service Layer
    ↓
Controller / REST API
    ↓
Frontend API Service
    ↓
React Components
    ↓
WisWits Alumni UI

---

## Integration Verification

The following areas were manually verified during module integration:

- MariaDB connection
- Backend startup
- API responses
- Frontend startup
- TypeScript validation
- Next.js production build
- Dashboard data loading
- Directory data loading
- Alumni search
- Batch filter
- Graduation year filter
- Course filter
- Filter reset
- Table / grid switching
- Dynamic alumni profile routing
- Real frontend-to-backend API communication
- Real backend-to-MariaDB communication
- Responsive browser layout

TypeScript verification:

npx tsc --noEmit

Production verification:

npm run build

---

## Platform Integration Boundary

This module intentionally does not implement an independent platform authentication or authorization system.

During integration into the parent WisWits SaaS platform, platform-level services should provide:

- Shared authentication middleware
- Cookie-based platform authentication
- Shared permission enforcement
- Shared database utilities
- Platform audit logging
- Module registry integration
- Platform navigation integration
- Shared API client integration where required

The standalone module should therefore be adapted to the parent platform's shared infrastructure rather than introducing duplicate authentication, permission, or database infrastructure.

---

## UI Standards

The module follows the WisWits visual direction:

- Navy: #0F2147
- Gold: #C8A04E
- Ivory: #F7F4EC
- Playfair Display
- Source Sans

Native browser alert, confirm, and prompt dialogs are not used.

---

## Development Workflow

Individual team contributions were first collected in the incoming workspace.

The final implementation was then:

1. Reviewed
2. Restructured
3. Database-integrated
4. Backend-integrated
5. Frontend-integrated
6. Connected through real APIs
7. Functionally tested
8. Production-build tested
9. Cleaned
10. Prepared for platform integration

---

## Final Status

Alumni Directory is ready for repository submission and parent-platform integration.

Further authentication, permission, audit, registry, and shared-platform alignment should be performed against the main WisWits SaaS architecture.