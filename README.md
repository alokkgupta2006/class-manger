# class-manger

A full-stack student attendance manager built with React, Vite, Tailwind CSS, Express, and Prisma. The default local database is SQLite. The demo seed creates `demo@student.com` / `Password123!`.

## Requirements

- Node.js 20+

## Run locally

1. Copy `backend/.env.example` to `backend/.env`. Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with separate random values (at least 32 characters each).
2. From the repository root:

   ```sh
   npm install
   npm run db:generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```

3. Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API runs on `http://localhost:4000`.

Prisma creates `backend/prisma/dev.db` automatically. The frontend proxies `/api` requests to the backend in development. To run either server alone, use `npm run dev -w backend` or `npm run dev -w frontend`.

## Production build

```sh
npm run build
npm start -w backend
```

Build the frontend with `npm run build`. Configure `CLIENT_ORIGIN`, `COOKIE_SECURE=true`, and `NODE_ENV=production` in production. Use HTTPS so secure, HTTP-only auth cookies can be set. Back up the SQLite database file as part of deployment.

## Data model and API

- Users own subjects; subjects own date-based attendance entries. Foreign keys, unique subject codes per owner, and one entry per subject/date prevent inconsistent duplicates.
- REST API: `/api/auth/{register,login,refresh,logout,me}`, `/api/subjects`, `/api/subjects/:id`, `/api/subjects/:id/attendance`, and `/api/attendance/:id`.
- Access and refresh JWTs use HTTP-only, same-site cookies. All subject/log operations are scoped to the authenticated user. Passwords are bcrypt-hashed.
- `Cancelled` entries do not count as classes held. Attendance percentages use present / (present + absent).
- Dashboard users can export all subjects and attendance records as CSV.
- The interface supports a persisted light/dark theme toggle.
- Daily notes are available at `/notes`, with date-based history, editing, and deletion.
- Notes can be downloaded as PNG images or printed/saved as PDF from the browser's print dialog.
- A personal weekly timetable is available at `/timetable`. Add, edit, or remove recurring classes by day and time.
- If you already have a local database, run `npm run db:push` after pulling schema updates to add new tables without resetting your data.

## Notes

Attendance has one record per subject per calendar date. Editing or removing a log immediately changes the calculated subject and overall totals. The seeded demo data covers five subjects and fifteen weekdays.
