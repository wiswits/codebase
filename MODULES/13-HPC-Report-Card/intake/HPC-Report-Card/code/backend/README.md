# WisWits HPC Report Card Backend

## Overview

This project is the backend service for the WisWits HPC Report Card module.

It follows a layered architecture:

```
Controller
     ↓
Service
     ↓
Repository
     ↓
MariaDB
```

---

## Tech Stack

- Node.js
- Express.js
- MariaDB
- ES Modules
- dotenv
- Helmet
- Morgan
- CORS

---

## Folder Structure

```
backend/

config/
controllers/
middleware/
repositories/
routes/
services/
utils/
validators/

app.js
server.js
package.json
.env
```

---

## Installation

Install dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

---

## Run Production Server

```bash
npm start
```

---

## Database

Database Name

```
wiswits_hpc_report_card
```

---

## Architecture

```
Client

↓

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

MariaDB
```

---

## Coding Standards

- ES Modules
- Async/Await
- Parameterized SQL Queries
- Centralized Error Handling
- Layered Architecture
- RESTful APIs

---

## Module

WisWits HPC Report Card

Version 1.0.0