# Sales Mongaz Prototype ✦

> Arabic-first, mobile-first Sales Operations workspace for accountable daily execution.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)

## ✨ What this is

Sales Mongaz is a production-oriented prototype for the Sales Operations pilot. It keeps the experience compact and operational: a representative sees today’s work, records field evidence, follows commitments, and reviews a persisted end-of-day ledger.

- 🌍 Arabic RTL-first mobile UI
- 📋 Task-first Representative workspace and Customer Operating File
- 🔐 Session, CSRF, role, and scope foundations
- 🧭 Persistent Customer, Commitment, Visit, and operational-evidence domains
- 🧾 Derived Close My Day ledger — never a duplicate manual report
- 🧪 API, database, runtime, and Playwright coverage

## 🧱 Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, TanStack Query |
| API | Fastify, Zod, Argon2id |
| Database | PostgreSQL, SQL migrations |
| Testing | Node test runner, Playwright |

## 🚀 Getting started

```bash
npm install
npm run dev
```

For the persistent API path, provide `DATABASE_URL` and run:

```bash
npm run api:migrate
npm run api:bootstrap
npm run api:seed-phase1
npm run api:seed-phase2
npm run api:start
```

Development seed values are clearly identified as `DEVELOPMENT/TEST`; they are not company records.

## ✅ Quality commands

```bash
npm run check:runtime      # protected mobile-runtime integrity
npm run test:api           # Phase 0–1 API tests
npm run test:api:phase2    # PostgreSQL-backed Phase 2 acceptance
npm run test:e2e:phase2    # production UI contract tests
npm run build              # typecheck + production build
npm run test:sites         # static Sites packaging checks
```

## 🗂️ Repository map

```text
src/        Production React application and UI foundations
api/        Fastify API, migrations, seeds, and acceptance tests
artifacts/  Frozen approved design artifacts
docs/       Freeze, handoff, implementation, and phase reports
tests/      Playwright runtime and production UI tests
```

## 🛡️ Design & scope

The approved artifacts under `artifacts/` and the AFDF design package are frozen. Product work preserves the Arabic operating-ledger language: evidence before action, compact rows, live commitments, restrained status semantics, and no generic CRM/dashboard drift.

## 📌 Current focus

Phase 2 establishes the Sales Representative vertical slice. Later role work—Telesales, Supervisor, Manager, notifications, and broad configuration—is intentionally outside this repository phase scope.

---

Built for clear ownership, real operational evidence, and the next committed action. ✨
