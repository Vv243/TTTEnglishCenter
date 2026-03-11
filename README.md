# TTTEnglishCenter (EduCore)

> A production-grade English tutoring center management system for Vietnamese education centers, combining advanced ML algorithms with modern web technologies.

**Live Frontend:** http://localhost:3000  
**Live API:** http://localhost:8000/docs  
**Database:** PostgreSQL on port 5433  
**Status:** 🔄 Day 10 In Progress (95%)

---

## 🎯 Project Overview

Building a comprehensive management system for Vietnamese English tutoring centers that serves 3 teachers managing 90+ students. This capstone project demonstrates serious engineering skills while solving real operational challenges for a real family business.

**Primary Users:** My mom (English teacher in Sài Gòn) and two aunts (from Châu Đốc, An Giang) — non-technical daily users  
**Admin Access:** Vinh (US-based) for remote oversight and error correction  
**Target Market:** Vietnamese tutoring centers (10-30 teachers)  
**Student Demographics:** Ages 7-18 (Primary through IELTS/SAT prep) + Adult Learners

---

## 🚀 Core Features

### ✅ ML-Powered Attendance Prediction
- **Random Forest Regressor** predicts attendance using payment cluster, grade level, discount, score
- At-risk detection flags students predicted below 70% attendance
- 31 enrollments analyzed with high confidence

### ✅ Payment Intelligence (ML Forecasting)
- **Hybrid forecasting:** Rule-based core × Facebook Prophet trend multiplier
- 90-day revenue forecast with ±15% confidence bands
- Per-student risk scoring blending payment cluster probability with actual history

### ✅ JWT Authentication & Role-Based Access
- Admin and Teacher roles with bcrypt password hashing
- Next.js middleware protecting all routes
- Route groups isolate sidebar/header from login page

### ✅ CSP Smart Scheduling
- Backtracking CSP solver with DAG conflict detection
- Duration-aware slots per class level (60–120 min)
- 6/6 classes scheduled, 0 conflicts across 3 teachers

### ✅ Multi-Day Class Scheduling
- Classes can run Mon/Wed/Fri, Tue/Thu, etc. (integer[] array in DB)
- Day toggle buttons in both Add and Edit class modals
- Auto-computes total sessions and sessions/month from date range + days selected

### ✅ Full CRUD with Soft Deletes
- Edit/Delete modals for Students and Classes
- Students: `is_active = false` | Classes: `status = 'cancelled'` — never hard delete
- All write endpoints protected by JWT

### 🔄 Payment Tracker (Day 10 — In Progress)
- **Class-first monthly view:** each class card shows paid/overdue/due counts
- **Expand class** → see each enrolled student's payment status for that month
- **Actions:** Mark Paid (cash/bank transfer), Postpone (requires reason + new date), Waive (requires reason)
- **Student history modal:** full payment timeline per student
- **Receipt printing:** bilingual Vietnamese receipt via `window.print()`
- **Enrollment auto-confirm:** first payment flips enrollment to Active

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python, async) |
| Database | PostgreSQL 16 (Docker, port 5433) |
| ORM | SQLAlchemy 2.0 (async + asyncpg) |
| ML | scikit-learn, Prophet, pandas, numpy |
| Auth | python-jose (JWT), passlib + bcrypt, js-cookie |
| Infrastructure | Docker Compose |

---

## 📊 Progress

| Day | Focus | Status |
|-----|-------|--------|
| 1-3 | Backend foundation, all APIs | ✅ Done |
| 4-5 | Frontend, search/filters, integration | ✅ Done |
| 6 | ML attendance prediction | ✅ Done |
| 7 | Address system upgrade + Payment forecasting | ✅ Done |
| 8 | JWT authentication + CSP scheduling | ✅ Done |
| 9 | Edit/Delete forms + type fixes | ✅ Done |
| 10 | Payment Tracker + Polish | 🔄 In Progress |
| 11 | Pre-deployment polish + bug fixes | 📅 Upcoming |
| 12 | Deployment (Vercel + Railway + Neon) | 📅 Upcoming |

---

## 🌐 Pages

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ Working (JWT, role-based) |
| Dashboard | `/` | ✅ Working |
| Teachers | `/teachers` | ✅ Working (search + role filter + add teacher) |
| Students | `/students` | ✅ Working (search + filters + edit/delete) |
| Classes | `/classes` | ✅ Working (multi-day toggles, start/end dates, edit/delete) |
| Enrollments | `/enrollments` | ✅ Working (active+scheduled classes, 3 status options) |
| ML Insights | `/ml` | ✅ Working (Random Forest + CSP scheduler) |
| Payments | `/payments` | 🔄 Day 10 — adding Monthly Tracker tab |

---

## 💰 Payment System

### Payment Methods
- **Tiền mặt** (Cash)
- **Chuyển khoản** (Bank Transfer)

### Payment Actions
| Action | Vietnamese | Effect |
|--------|-----------|--------|
| Mark Paid | Đã thanh toán | Records payment, flips enrollment to Active |
| Postpone | Hoãn thanh toán | Records late + new due date, requires reason |
| Waive | Miễn học phí | Records as paid at 0₫, requires reason |

### Monthly Tracker Flow
1. Open **Payments → Monthly Tracker**
2. See all active/scheduled classes for selected month
3. Classes sorted: overdue → due → all paid
4. Expand class → see each student's status
5. One-click Mark Paid for normal payments
6. Postpone/Waive open a reason form

---

## 🔐 Authentication

Default accounts seeded at setup:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| co_lan | teacher123 | Teacher |
| co_mai | teacher123 | Teacher |
| thay_duc | teacher123 | Teacher |

JWT tokens expire after 8 hours. All write endpoints (POST/PATCH/DELETE) require Bearer token.

---

## 🇻🇳 Vietnam Address System (Post July 2025)

As of July 1, 2025, Vietnam moved from a 3-tier to a 2-tier administrative system:

- **Old:** Province → District (Quận/Huyện) → Ward (Phường/Xã)
- **New:** Province → Ward (Phường/Xã) — district level eliminated
- **Provinces:** Reduced from 63 to 34

EduCore accepts both old-style ("Quận 1") and new-style ("Phường Bến Nghé") ward entries.

---

## 🗄️ Database

**Data:** 3 teachers, 21 students, 6 classes, 31 enrollments, 126 payment history records, 4 users

**Tables:**
- `teachers`, `students`, `classes`, `enrollments` — core data
- `payment_history` — payment records with method, note, recorded_by, enrollment_id
- `users` — admin/teacher accounts with bcrypt hashed passwords

**Rules:**
- UUID primary keys everywhere
- Soft deletes only — `is_active = false` (students), `status = 'cancelled'` (classes)
- Port 5433 — never change to 5432

---

## 🚀 Quick Start (Windows PowerShell)

```powershell
# 1. Start Docker services
docker-compose up -d

# 2. Backend (new terminal)
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (new terminal)
cd frontend
npm run dev
```

Navigate to http://localhost:3000 — you'll be redirected to `/login`. Use `admin` / `admin123`.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

---

## 🐛 Known Issues & Fixes

| Issue | Fix |
|-------|-----|
| passlib + modern bcrypt conflict | `pip install bcrypt==4.0.1` |
| PowerShell $ interpolation corrupts hashes | Write SQL via Python script file |
| Hydration error in Header | Read cookie in useEffect, not during render |
| Login page shows sidebar | Use (main) route group + bare root layout.tsx |
| Classes API 500 | Invalid level value — check constraint |
| Province filter ignored | Backend param is `province_city` not `district` |
| discount_percent missing | Column is on enrollments, not students table |
| PATCH/DELETE 307 redirect | All update/delete API calls need trailing slashes |
| GradeLevel "adult" missing | Syntax error fixed in types/index.ts |
| parent_zalo_id wrong field | Actual DB column is `parent_zalo` |
| room wrong field on Class | Actual DB column is `room_number` |
| semester NOT NULL violation | ALTER TABLE classes ALTER COLUMN semester DROP NOT NULL |
| Class card showing wrong day | Fixed to use days_of_week array |
| EditClassModal single day only | Replaced with 7 toggle buttons |
| Enrollment picker requires typing | Changed to always show classes on open |
| Scheduled classes missing from enrollment | Filter changed to active OR scheduled |

---

## 👨‍💻 Author

**Vinh Pham** — capstone project (February–April 2026)  
Building for family's tutoring center in Sài Gòn.  
Mom teaches in Sài Gòn · Aunts from Châu Đốc, An Giang.

**Built with ❤️ for Vietnamese English teachers**  
*Last Updated: March 9, 2026 — Day 10 In Progress (95%)*