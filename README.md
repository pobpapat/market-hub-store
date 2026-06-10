# Fullstack Next.js + Express + PostgreSQL with GitLab CI

This repository is structured as a separate Frontend (Next.js) and Backend (Express + Prisma 7 + PostgreSQL) project.

## Project Structure

```text
├── backend/                # Express API & Prisma 7
│   ├── src/                # TS Source Code
│   ├── tests/              # Jest API Integration Tests
│   ├── prisma.config.ts    # Prisma 7 Database Configuration
│   └── prisma/             # Prisma Schema
├── frontend/               # Next.js App Router (Tailwind CSS)
└── .gitlab-ci.yml          # GitLab CI/CD Pipeline
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database running locally or in Docker.

---

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables. Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
3. Run migrations / push the schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```
4. Start the backend development server (runs on port 5000):
   ```bash
   npm run dev
   ```

### Running Backend Tests
Ensure your `.env` contains a test database URL, then run:
```bash
npm run test
```

---

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Next.js development server (runs on port 3000):
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## GitLab CI/CD Pipeline

The GitLab pipeline config is stored in `.gitlab-ci.yml`. On push/merge requests:
- Spins up a `postgres:16-alpine` service container.
- Installs dependencies.
- Generates Prisma Client.
- Pushes the database schema using `npx prisma db push --accept-data-loss`.
- Runs the backend integration test suite.
