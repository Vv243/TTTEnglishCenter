# TTTEnglishCenter (EduCore)

> A production-grade English tutoring center management system for Vietnamese education centers, combining advanced ML algorithms with modern web technologies.

**Live Frontend:** http://localhost:3000  
**Live API:** http://localhost:8000/docs  
**Database:** PostgreSQL on port 5433  
**Status:** 🟢 Day 7 In Progress - Address System Upgraded (65%)

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
- **21 enrollments analyzed**, 5 at-risk identified, confidence: high

### Feature 2: Payment Forecasting (Day 7)
- **Facebook Prophet:** 90-day revenue forecasting
- **Target:** 87%+ forecast accuracy

### Feature 3: Smart Scheduling (Days 8-9)
- **CSP Solver:** Optimal makeup class scheduling

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| Backend | FastAPI (Python, async) |
| Database | PostgreSQL 16 (Docker, port 5433) |
| ORM | SQLAlchemy 2.0 (async + asyncpg) |
| ML | scikit-learn, Prophet, pandas, numpy |
| Infrastructure | Docker Compose |

---

## 📊 Progress

| Day | Focus | Status |
|-----|-------|--------|
| 1-3 | Backend foundation, all APIs | ✅ Done |
| 4-5 | Frontend, search/filters, integration | ✅ Done |
| 6 | ML attendance prediction | ✅ Done |
| 7 | Address system upgrade + Payment forecasting | 🔄 In Progress |
| 8-9 | CSP scheduling + edit/delete + mobile polish | 📅 Upcoming |
| 10 | Deployment (Vercel + Railway + Neon) | 📅 Upcoming |

---

## 🇻🇳 Vietnam Address System (Post July 2025)

As of July 1, 2025, Vietnam moved from a 3-tier to a 2-tier administrative system:

- **Old:** Province → District (Quận/Huyện) → Ward (Phường/Xã)
- **New:** Province → Ward (Phường/Xã) — district level eliminated
- **Provinces:** Reduced from 63 to 34

Key changes for this app:
- An Giang merged with Kiên Giang (includes Châu Đốc and Phú Quốc)
- HCM City absorbed Bình Dương and Bà Rịa–Vũng Tàu
- "Quận 1" etc. are now colloquial — official addresses use ward names

EduCore address fields (all optional, free text except province dropdown):

| Field | Example |
|-------|---------|
| `street_address` | 45A Nguyễn Đình Chiểu |
| `ward` | Phường Đa Kao OR Quận 1 (both accepted) |
| `province_city` | TP. Hồ Chí Minh (dropdown of 34 + free text) |

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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

---

## 🗄️ Database

**Data:** 3 teachers, 20 students, 6 classes, 31 enrollments

**Key constraints:**
- `check_reasonable_age`: DOB must be 5-80 years ago (supports adult learners)
- `students_grade_level_check`: primary_1-5, secondary_6-9, high_10-12, **adult**
- `classes_level_check`: primary_1-5, secondary_6-9, high_10-12, starters, movers, flyers, ket, pet, fce, ielts, toefl, sat, general_english

**Rules:**
- UUID primary keys — never auto-increment
- Soft deletes — `is_active = false`, never hard delete
- Port 5433 — never change to 5432

---

## 🐛 Known Issues & Fixes

| Issue | Fix |
|-------|-----|
| Classes API 500 | Invalid level value — check constraint above |
| Students page empty | Trailing slashes on API calls + remap `d.students` |
| Port 5432 conflict | Intentionally uses 5433 — do not change |
| Student create 500 | Check age constraint (5-80) and grade_level includes adult |
| Province filter ignored | Backend param is `province_city` not `district` |

---

## 👨‍💻 Author

**Vinh Pham** — 10-week capstone (February–April 2026)  
Building for family's tutoring center in Sài Gòn.  
Mom teaches in Sài Gòn · Aunts from Châu Đốc, An Giang.

**Built with ❤️ for Vietnamese English teachers**  
*Last Updated: February 27, 2026 — Day 7 In Progress (65%)*