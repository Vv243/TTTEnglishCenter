# TTTEnglishCenter (EduCore)

> A production-grade English tutoring center management system for Vietnamese education centers, combining advanced ML algorithms with modern web technologies.

**Live Frontend:** http://localhost:3000  
**Live API:** http://localhost:8000/docs  
**Database:** PostgreSQL on port 5433  
**Status:** ✅ Day 11 Complete (98%)

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

### ✅ Payment Tracker (Day 11 — Complete)
- **Class-first monthly view:** each class card shows paid/overdue/due counts + revenue collected
- **Month navigation:** `‹ March 2026 ›` arrows, "Back to current month" shortcut
- **Search bar:** filter classes by name, teacher, or level in real time
- **Expand class** → see each enrolled student's payment status for that month
- **Actions:** Mark Paid (cash/bank transfer), Postpone (requires reason + new due date), Mark Missed
- **Student history modal:** full payment timeline per student with collection rate summary
- **Receipt printing:** bilingual Vietnamese PHIẾU THU receipt via `window.print()`
- **Enrollment auto-confirm:** first payment flips enrollment status from Scheduled → Active

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
| 10 | Polish + bug fixes (enrollment names, cancelled class filter, delete working) | ✅ Done |
| 11 | Payment Tracker (backend + frontend) | ✅ Done |
| 12 | Pre-deployment polish | 📅 Upcoming |
| 13 | Deployment (Vercel + Railway + Neon) | 📅 Upcoming |

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
| Payments | `/payments` | ✅ Working (Monthly Tracker + Revenue Forecast + Payment Risk) |

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
| Mark Missed | Không thanh toán | Records missed payment |

### Monthly Tracker Flow
1. Open **Payments → Monthly Tracker**
2. Navigate months with `‹ ›` arrows
3. See all active/scheduled classes — search by name, teacher, or level
4. Expand class → see each student's payment status
5. Click **Record** → choose Paid/Postpone/Missed + payment method + optional note
6. Paid students show **🖨 Receipt** button → prints bilingual PHIẾU THU
7. Click any student name → view full payment history modal

### Payment History
- Per-student timeline showing month, class, amount, status, method
- Collection rate summary (Total Paid / Total Missed / %)
- Older seed records (pre-Day 11) show `—` for class/method — expected behavior

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

**Data:** 3 teachers, 20 students, 5 active classes (1 cancelled), ~22 enrollments, 126+ payment history records, 4 users

**Tables:**
- `teachers`, `students`, `classes`, `enrollments` — core data
- `payment_history` — payment records with `enrollment_id`, `payment_method`, `note`, `recorded_by` (added Day 11)
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
| Class edit 500 (unique constraint) | Dropped idx_teacher_schedule_unique, idx_room_schedule_unique, idx_classes_schedule |
| Payment history class_.name error | Class model uses class_name not name |
| ClassModel.name error in payments | Class model uses class_name not name |

---

## 👨‍💻 Author

**Vinh Pham** — capstone project (February–April 2026)  
Building for family's tutoring center in Sài Gòn.  
Mom teaches in Sài Gòn · Aunts from Châu Đốc, An Giang.

**Built with ❤️ for Vietnamese English teachers**  
*Last Updated: March 12, 2026 — Day 11 Complete (98%)*