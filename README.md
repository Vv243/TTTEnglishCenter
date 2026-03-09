# TTTEnglishCenter (EduCore)

> A production-grade English tutoring center management system for Vietnamese education centers, combining advanced ML algorithms with modern web technologies.

**Live Frontend:** http://localhost:3000  
**Live API:** http://localhost:8000/docs  
**Database:** PostgreSQL on port 5433  
**Status:** 🟢 Day 9 Complete (90%)

---

## 🎯 Project Overview

Building a comprehensive management system for Vietnamese English tutoring centers that serves 3 teachers managing 90+ students. This 10-week capstone project demonstrates serious engineering skills while solving real operational challenges.

**Primary Users:** My mom (English teacher in Sài Gòn) and two aunts (from Châu Đốc, An Giang)  
**Target Market:** Vietnamese tutoring centers (10-30 teachers)  
**Student Demographics:** Ages 7-18 (Primary through IELTS/SAT prep) + Adult Learners

---

## 🚀 Core Features

### Feature 1: ML-Powered Attendance Prediction ✅ LIVE
- **Random Forest Regressor:** Predicts attendance using payment cluster, grade level, discount, score
- **At-Risk Detection:** Flags students predicted below 70% attendance
- **31 enrollments analyzed**, at-risk students identified, confidence: high

### Feature 2: Payment Intelligence ✅ LIVE
- **Hybrid Forecasting:** Rule-based core × Facebook Prophet trend multiplier
- **90-day revenue forecast** with confidence bands (±15%)
- **Per-student risk scoring** blending payment cluster probability with actual history
- **Endpoints:** `/ml/payment-forecast`, `/ml/payment-risk`

### Feature 3: JWT Authentication ✅ LIVE
- **Role-based access control:** Admin and Teacher roles
- **bcrypt password hashing** with secure JWT token generation (8hr expiry)
- **Next.js middleware** protecting all routes, redirecting to `/login`
- **Route groups:** `(main)/` isolates sidebar/header from login page
- **Default accounts:** admin/admin123, teacher accounts for all 3 teachers

### Feature 4: CSP Smart Scheduling ✅ LIVE
- **Backtracking CSP solver** with DAG conflict detection
- **Duration-aware slots** per class level (60–120 min)
- **Teacher conflict prevention** across 6 concurrent classes
- **6/6 classes scheduled, 0 conflicts** across 3 teachers
- **Endpoint:** `POST /ml/schedule`

### Feature 5: Edit & Delete Forms ✅ LIVE
- **EditStudentModal:** Slide-in panel, pre-populated PATCH `/students/{id}` — all fields including Vietnam 2-tier address
- **EditClassModal:** Slide-in panel, pre-populated PATCH `/classes/{id}` — level, teacher, schedule, financials
- **DeleteConfirmDialog:** Reusable soft-delete confirmation — students set `is_active=False`, classes set `status=cancelled`
- **Action icons** on every student row and class card (pencil = edit, trash = deactivate)

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
| 10 | Deployment (Vercel + Railway + Neon) | 📅 Upcoming |

---

## 🌐 Pages

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ Working (JWT, role-based) |
| Dashboard | `/` | ✅ Working |
| Teachers | `/teachers` | ✅ Working (search + role filter) |
| Students | `/students` | ✅ Working (search + filters + edit/delete) |
| Classes | `/classes` | ✅ Working (card grid + edit/delete) |
| Enrollments | `/enrollments` | ✅ Working (attendance + trends) |
| ML Insights | `/ml` | ✅ Working (Random Forest + CSP scheduler) |
| Payments | `/payments` | ✅ Working (forecast chart + risk table) |

---

## 🔐 Authentication

Default accounts seeded at setup:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| co_lan | teacher123 | Teacher |
| co_mai | teacher123 | Teacher |
| thay_duc | teacher123 | Teacher |

JWT tokens expire after 8 hours. All write endpoints (POST/PATCH/DELETE) require a valid Bearer token.

---

## 🇻🇳 Vietnam Address System (Post July 2025)

As of July 1, 2025, Vietnam moved from a 3-tier to a 2-tier administrative system:

- **Old:** Province → District (Quận/Huyện) → Ward (Phường/Xã)
- **New:** Province → Ward (Phường/Xã) — district level eliminated
- **Provinces:** Reduced from 63 to 34

EduCore address fields (all optional):

| Field | Example |
|-------|---------|
| `street_address` | 45A Nguyễn Đình Chiểu |
| `ward` | Phường Đa Kao OR Quận 1 (both accepted) |
| `province_city` | TP. Hồ Chí Minh (dropdown of 34 + free text) |

---

## 🗄️ Database

**Data:** 3 teachers, 21 students, 6 classes, 31 enrollments, 126 payment history records, 4 users

**Tables:**
- `teachers`, `students`, `classes`, `enrollments` — core data
- `payment_history` — 6 months of payment records (Jul–Dec 2025)
- `users` — admin/teacher accounts with bcrypt hashed passwords

**Rules:**
- UUID primary keys — never auto-increment
- Soft deletes — `is_active = false` (students), `status = 'cancelled'` (classes) — never hard delete
- Port 5433 — never change to 5432

---

## 🤖 ML & Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login, returns JWT token |
| `/auth/register` | POST | Register user (admin only) |
| `/auth/me` | GET | Get current user info |
| `/ml/predict-attendance/{id}` | GET | Predict attendance for one enrollment |
| `/ml/attendance-summary` | GET | Predict attendance for all active enrollments |
| `/ml/payment-forecast` | GET | 90-day revenue forecast |
| `/ml/payment-risk` | GET | Per-student payment risk ranking |
| `/ml/schedule` | POST | Generate conflict-free timetable via CSP |

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
| PowerShell $ interpolation corrupts hashes | Write SQL via Python script file, not here-string |
| Hydration error in Header | Read cookie in useEffect, not during render |
| Login page shows sidebar | Use (main) route group + bare root layout.tsx |
| Classes API 500 | Invalid level value — check constraint |
| Province filter ignored | Backend param is `province_city` not `district` |
| discount_percent missing | Column is on enrollments, not students table |
| PATCH/DELETE 307 redirect | All update/delete API calls need trailing slashes |
| GradeLevel "adult" missing | Syntax error fixed in types/index.ts |
| parent_zalo_id wrong field | Actual DB column is `parent_zalo` |
| room wrong field on Class | Actual DB column is `room_number` |

---

## 👨‍💻 Author

**Vinh Pham** — 10-week capstone (February–April 2026)  
Building for family's tutoring center in Sài Gòn.  
Mom teaches in Sài Gòn · Aunts from Châu Đốc, An Giang.

**Built with ❤️ for Vietnamese English teachers**  
*Last Updated: March 9, 2026 — Day 9 Complete (90%)*