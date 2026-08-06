# Class & Test Series Platform

## Project Overview

The Class & Test Series Platform is a web-based application designed to support the management of classes, tests, students, questions, test attempts, results, and related academic activities.

This repository contains the current development version of the project.

---

## Current Development Status

The core application structure and major functionalities have been implemented.

### Frontend

- Frontend development is completed and functional.
- Dashboard and application pages have been implemented.
- Navigation between modules is working.
- Interactive buttons, forms, modals, and other UI components have been implemented.
- The interface has been designed to provide a responsive and user-friendly experience.

### Backend

- Backend development has been implemented.
- Backend APIs and required application logic have been set up.
- Frontend and backend communication has been established.
- The backend is successfully connected with the database.

### Database

- PostgreSQL database integration has been completed.
- The backend is successfully connected to the database.
- Required database structure has been configured for the current implementation.
- Dummy/demo data has been used where required for development and functional testing.

---

## Authentication / Login

The login and authentication system has not been implemented separately in this project.

The platform is intended to use the company's existing authentication/login system. Therefore, a separate login mechanism has intentionally not been added to avoid duplicating the company's authentication infrastructure.

Authentication can be integrated with the company's existing system during final integration.

---

## Demo / Dummy Data

Real organizational data was not provided during the development phase.

Therefore, dummy/demo data has been used where required to:

- Test frontend components
- Verify application workflows
- Test API integration
- Validate database connectivity
- Demonstrate application functionality

The dummy data is intended only for development and testing purposes and can be replaced with actual organizational data during production integration.

---

## Current Functional Behaviour

The major frontend interactions and navigation are functional.

The frontend, backend, and PostgreSQL database are successfully connected.

However, some data-dependent features may not currently return complete or production-level results because actual organizational data and certain production integrations are not available in the current development environment.

For example, workflows such as:

- Starting and completing tests
- Test results
- Student performance data
- Analytics
- Rankings
- Reports
- Other data-dependent operations

may require complete production data and additional final integration to provide actual results.

Dummy data has been used to test and demonstrate these workflows wherever possible.

---

## Current Implementation Status

| Module | Status |
|---|---|
| Frontend Development | Completed |
| Frontend Navigation | Functional |
| UI Components & Interactions | Functional |
| Backend Development | Implemented |
| Frontend-Backend Connection | Connected |
| PostgreSQL Database | Connected |
| Demo/Dummy Data | Implemented where required |
| Company Authentication | Pending Company Integration |
| Production Data | Not Provided |
| Data-Dependent Results | Partially Functional |
| Final Production Integration | Pending |

---

## Known Limitations

The current version is a development implementation and has the following limitations:

- Real organizational/student data has not been provided.
- Company authentication integration is pending.
- Some functionality currently operates using dummy/demo data.
- Certain data-dependent workflows may not produce complete results.
- Additional testing and production-level integration may be required once actual APIs, authentication, and organizational data are available.

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Modern responsive UI components

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- PostgreSQL

---


## Running the Project

### Backend

Navigate to the backend directory:

npm install

Then start the backend:

npm run dev

or:

npm start


## Important Note

This project represents the current development implementation based on the provided project requirements.

The frontend, backend, and database integration have been implemented successfully. Dummy data has been used where real organizational data was unavailable.

Some features require company authentication, actual organizational data, and final production integration before they can operate with complete real-world results.

Further improvements and integrations can be carried out based on company requirements, production data availability, and technical review.

---

## Project Status

**Development Status:** Functional Development Version

**Frontend:** Functional

**Backend:** Functional

**Database:** Connected

**Production Integration:** Pending

**Company Authentication Integration:** Pending