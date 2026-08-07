# Intake — Library Management Module

Full-stack implementation of the Library Management module described in the PRD (v1.0), built with:

- **Frontend**: React + Vite, Tailwind CSS, Recharts
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose) — swapped in place of the PRD's original MySQL choice

## What's included (matches PRD section 6)

- Book catalogue: add/edit/delete, search by title/author/ISBN, live availability
- Book copies: per-copy barcode tracking, status (Available/Issued/Lost/Damaged)
- Issue/Return register: issue a book, return with automatic fine calculation (₹2/day, configurable), overdue view
- My Books: self-service view for students, teachers (as borrowers), and parents (their child's records)
- Statistics dashboard: live counters, most-issued books, category breakdown, copy availability, 7-day issue/return trend
- Role-based access: admin, teacher, student, parent — every write action is server-side role-checked
- Multi-tenancy: every record is scoped by `orgId` so multiple schools could share a deployment

## What's intentionally NOT built (per PRD sections 4 and 11)

- Real authentication — there's a **dev-only role switcher** in the header that lets you pick a demo user
  (admin / teacher / student / parent) and simulates their session via an `x-user-id` header. Swap this for
  real WisWits login before production.
- Fine payment collection (the system calculates the fine; collecting payment happens elsewhere, same as other
  WisWits fee flows)
- Barcode scanner hardware, reservations/holds, e-book lending, multi-branch support

## Project structure

```
wiswits-library/
├── backend/         Express API + MongoDB models
│   ├── src/
│   │   ├── config/       DB connection
│   │   ├── models/       Book, BookCopy, IssueRecord, User
│   │   ├── middleware/   dev auth + role checks
│   │   ├── controllers/  route handlers
│   │   ├── routes/       Express routers
│   │   └── seed/         sample data generator
│   └── server.js
└── frontend/         React + Vite app
    └── src/
        ├── api/          axios client (attaches dev auth header)
        ├── context/       AuthContext (role switcher state)
        ├── components/    Sidebar, Header, StatCard, Modal
        └── pages/         Dashboard, Books, BookCopies, IssueRegister, MyBooks, Statistics
```

## Setup

### 1. MongoDB

You need a running MongoDB instance. Easiest options:

- Local: install MongoDB Community Server and run `mongod`, or `docker run -d -p 27017:27017 mongo`
- Cloud: create a free cluster on MongoDB Atlas and copy its connection string

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env if your MONGO_URI is different from the default local one
npm install
npm run seed     # creates demo users, books, copies, and issue records
npm run dev      # starts the API on http://localhost:5000
```

The seed script prints out the demo users it created (admin, teacher, 5 students, 1 parent) along with their
IDs — you don't need these manually, the frontend fetches them automatically for the role switcher.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # starts the app on http://localhost:5173
```

Vite is already configured to proxy `/api` requests to `http://localhost:5000`, so just open
`http://localhost:5173` once both servers are running.

### 4. Using the app

- Use the account switcher in the top-right header to log in as different demo users and see how the
  navigation and permissions change per role (admin/teacher see the full operational dashboard and can
  issue/return books; students/parents see "My Books" only).
- Issuing and returning books, adding copies, and editing the catalogue all hit the real API and read/write
  MongoDB — this is a working prototype, not static mock data.

## Configuration

`backend/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 5000 | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/wiswits_library` | MongoDB connection string |
| `FINE_PER_DAY` | 2 | Overdue fine rate in ₹/day (PRD open question — currently fixed, not per-school) |
| `DEFAULT_LOAN_DAYS` | 14 | Default loan period when issuing a book |

## API reference (summary)

All responses follow `{ status, message, data }`.

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/api/users/demo-users` | none | list demo users (role switcher) |
| GET | `/api/books` | any | search/list catalogue with live availability |
| POST | `/api/books` | admin, teacher | add a book |
| PUT | `/api/books/:id` | admin, teacher | edit a book |
| DELETE | `/api/books/:id` | admin | delete a book (blocked if copies issued) |
| GET | `/api/copies` | any | list physical copies |
| POST | `/api/copies` | admin, teacher | add a copy |
| PATCH | `/api/copies/:id/status` | admin, teacher | mark Available/Lost/Damaged |
| DELETE | `/api/copies/:id` | admin | delete a copy (blocked if issued) |
| GET | `/api/issue-register` | admin, teacher | list register, filter by status/overdue |
| POST | `/api/issue-register/issue` | admin, teacher | issue a book |
| POST | `/api/issue-register/:id/return` | admin, teacher | return a book (auto fine) |
| GET | `/api/my-books` | any | own (or linked child's) borrowing history |
| GET | `/api/stats/summary` | any | live dashboard counters |
| GET | `/api/stats/most-issued` | any | top 5 most-issued books |
| GET | `/api/stats/category-breakdown` | any | books grouped by category |
| GET | `/api/stats/copy-availability` | any | available/issued/lost/damaged counts |
| GET | `/api/stats/issue-return-trend` | any | last 7 days issued vs returned |

## Next steps toward production (PRD section 14)

1. Replace the dev role switcher with real WisWits authentication (JWT/session), keeping the same
   `req.currentUser` shape so controllers don't need to change.
2. Add the fine payment collection flow (outside this module, same as other WisWits fee flows).
3. Decide whether `FINE_PER_DAY` should be configurable per school (open question in PRD section 13).
4. Pilot with one school's library, gather feedback, and plan v2 (reservations, barcode scanner, reminders).
