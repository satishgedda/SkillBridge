# SkillBridge — Placement Readiness & Career Diagnostic Engine
React + Vite + Tailwind v4 frontend · Node/Express 5 + MongoDB (Mongoose) backend · JWT in HTTP-only cookies · role-based access (student, mentor, college, admin).

## Run locally
Requirements: Node 18.11+, MongoDB (local or Atlas).

The workspace has an outer folder containing the application folder, so run these commands from the **outer** `skillbridge` folder (the one containing the root `package.json`). In VS Code PowerShell:
```powershell
cd C:\path\to\skillbridge
npm install
npm install --prefix .\skillbridge\server
npm install --prefix .\skillbridge\client
if (!(Test-Path .\skillbridge\server\.env)) { Copy-Item .\skillbridge\server\.env.example .\skillbridge\server\.env }
```

Edit `.\skillbridge\server\.env` and set a valid MongoDB URI and a private JWT secret of at least 24 characters. Do not overwrite an existing `.env`, commit it, or share its contents. The existing placeholder JWT secret must be replaced before the API can start. Start both services from the same outer folder:
```powershell
npm run dev
```

The API uses port 5000 and Vite uses port 5173. Vite now fails clearly if 5173 is occupied instead of switching to a URL the API may not allow. The client proxies `/api` to the backend. Open `http://localhost:5173`. To start separately, use two terminals from the outer folder:
```powershell
npm --prefix .\skillbridge\server run dev
npm --prefix .\skillbridge\client run dev
```

The optional `npm --prefix .\skillbridge\server run seed` command inserts sample assessment data and can create local admin, student, and mentor accounts from `SEED_*_EMAIL` and `SEED_*_PASSWORD` variables. Configure an admin pair before seeding; optional student/mentor pairs each need both values. Seeded passwords must be at least 12 characters. It also adds fictional college, student, and mentor profiles using reserved `.test` email addresses, with mentor availability for booking tests. These profiles are marked as demo data and have randomly generated, undisclosed passwords; configure the optional seed account pairs when you need accounts you can log into. Seeding refuses to run unless `NODE_ENV=development`, does not replace existing matching records, and never prints credentials.

## Try the full flow
1. Log in as the student, enroll in the drive (free), take Aptitude, then Technical Assessment.
2. Round 3 (interview): book a sample-mentor slot. Log in as the mentor, accept it. A mentor can only evaluate after the slot start time — to test, create a slot a few minutes ahead in Availability, or edit `start` in MongoDB.
3. Mentor submits the scorecard; the round score is the weighted total (DSA 25 / Programming 20 / CS 20 / Projects 20 / Problem solving 15; HR 30/25/20/15/10). Repeat for the HR round.
4. Student opens Performance Reports → "Get my certificate" (needs the level set in Admin → Settings, default *Placement Ready* = 70+). Verify at `/verify/<certId>`.

## What is implemented
Public site (home + 10 info pages, legal pages are DRAFT placeholders), registration/login for 3 roles, student dashboard (profile, drives, sequential rounds stored in DB, timed MCQ with server-side scoring, booking with atomic double-booking protection, cancellation, reports, skill improvement, certificates with QR + print-to-PDF, payments, notifications), mentor dashboard (verification gate, availability, accept/reject, scorecards, earnings), college dashboard (approval gate, add students, CSV import, assign drives, analytics), admin dashboard (stats, users with pagination, mentor/college approval, drives, question bank, records, refunds, certificate revoke, readiness settings, audit log).
Security: bcrypt, HTTP-only JWT cookie, role guards, zod validation, helmet, rate limiting, ownership checks on every student/mentor/college query, idempotent payment capture with HMAC signature verification and webhook.

## Not built yet (be upfront in demos)
- **Coding assessments / Monaco editor**: needs a sandbox provider (Judge0, Piston, etc.). Never run student code on the API server. Add a `kind: 'coding'` question type and a service that calls the provider.
- **Video**: interviews use a generated Jitsi Meet link (no custom video system). Swap for Daily/Agora if preferred.
- **Email verification, password reset, resume/photo upload (Cloudinary/S3)**: profile stores URLs only; email is logged to console unless `npm i nodemailer` + SMTP vars.
- **Interview reminders (needs a scheduler), charts library (CSS bars used), PDF generation (browser Save-as-PDF)**, Company/Review models, corporate recruiter and AI features.
- **Razorpay**: set `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` for real payments (webhook URL `/api/payments/webhook`). Without keys, DEV payments are used and are disabled when `NODE_ENV=production`.
- This environment did not permit running npm commands, and a live Atlas connection/browser flow has not been verified here. Run the setup above and verify MongoDB access with the API's `http://localhost:5000/api/health` endpoint.

## Deploy
Database: MongoDB Atlas. API (Render): root `server`, build `npm install`, start `npm start`, set env vars (`NODE_ENV=production`, `CLIENT_URL=<vercel url>`). Frontend (Vercel): root `client`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<api>.onrender.com/api`. Because cookies are cross-site in production, API and site should ideally share a parent domain.
