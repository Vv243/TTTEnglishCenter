# TTTEnglishCenter (EduCore)

> A production-grade English tutoring center management system for Vietnamese education centers, combining advanced ML algorithms with modern web technologies.

**Live Frontend:** http://localhost:3000  
**Live API:** http://localhost:8000/docs  
**Database:** PostgreSQL on port 5433  
**Status:** 🟢 Day 6 Complete - ML Attendance Prediction Live (60%)

---

## 🎯 Project Overview

Building a comprehensive management system for Vietnamese English tutoring centers that serves 3 teachers managing 90+ students. This 10-week capstone project demonstrates serious engineering skills while solving real operational challenges.

**Primary Users:** My mom and two aunts (English teachers in Ho Chi Minh City)  
**Target Market:** Vietnamese tutoring centers (10-30 teachers)  
**Student Demographics:** Ages 7-18 (Primary through IELTS/SAT prep)

---

## 🚀 Core Features & Algorithms

### Feature 1: ML-Powered Attendance Prediction ✅ LIVE
- **Random Forest Regressor:** Attendance rate prediction using payment cluster, grade level, discount, and score features
- **At-Risk Detection:** Automatic flagging of students predicted below 70% attendance
- **21 enrollments analyzed**, 5 at-risk students identified, confidence: high
- **Target:** Reduce unexpected absences by 40%

### Feature 2: Intelligent Payment & Financial Forecasting (Day 7)
- **Facebook Prophet:** Time-series revenue forecasting (90-day predictions)
- **K-Means Clustering:** Payment behavior segmentation (already in DB)
- **Target:** 87%+ forecast accuracy

### Feature 3: Smart Scheduling (Days 8-9)
- **CSP Solver:** Optimal makeup class scheduling with 7+ constraints
- **DAG + Topological Sort:** Prerequisite dependency management
- **Target:** 20% reduction in total teaching weeks

---

## 🏗️ Technical Architecture

### Frontend (✅ COMPLETE)
- **Framework:** Next.js 14 with TypeScript
- **UI:** TailwindCSS + shadcn/ui components
- **State:** React hooks + Axios API client
- **Design:** Vietnamese educational heritage aesthetic
- **Fonts:** IBM Plex Sans + Space Mono

### Backend (✅ COMPLETE)
- **Framework:** FastAPI (Python, async)
- **Database:** PostgreSQL 16 (Docker, port 5433)
- **ORM:** SQLAlchemy 2.0 (async)
- **API:** 21 RESTful endpoints across 6 sections
- **ML:** scikit-learn Random Forest (live)

### ML/Analytics Stack
- **scikit-learn:** Random Forest Regressor (✅ live)
- **prophet:** Facebook's time-series forecasting (Day 7)
- **pandas/numpy:** Data processing and feature engineering

### Infrastructure
- **Docker:** PostgreSQL, Redis, pgAdmin
- **CI/CD:** GitHub Actions

---

## 📊 Current Progress (Day 6 Complete - 60%)

### ✅ Days 1-3: Backend Foundation (30%)
- ✅ 4 core tables with Vietnamese context
- ✅ 3-category education system
- ✅ 19 REST endpoints with full CRUD
- ✅ Async SQLAlchemy + proper UTF-8 Vietnamese support

### ✅ Days 4-5: Frontend Integration (50%)
- ✅ Dashboard with real-time statistics
- ✅ Teachers page with search + role filter
- ✅ Students page with debounced search + grade/cluster/district filters
- ✅ Classes page with card grid view + capacity bars
- ✅ Enrollments page with attendance tracking + performance trends
- ✅ Add Student modal with Vietnamese district selection
- ✅ Fixed all API response mapping (trailing slashes, field remapping)
- ✅ Fixed classes level constraint (updated seed data to 3-category system)

### ✅ Day 6: ML Attendance Prediction (60%)
- ✅ Seeded realistic attendance data (31 enrollments with varied patterns)
- ✅ Random Forest ML endpoint (`/api/v1/ml/attendance-summary`)
- ✅ Per-enrollment prediction endpoint (`/api/v1/ml/predict-attendance/{id}`)
- ✅ ML Insights page with at-risk dashboard
- ✅ Risk distribution visualization
- ✅ Payment cluster to attendance pattern mapping:
  - `always_on_time` → predicted 88-98%
  - `needs_reminder` → predicted 65-75%
  - `erratic` → predicted 59-63%
  - `high_risk` → predicted 50-53%

### 📅 Day 7: Payment Forecasting (Prophet)
- Facebook Prophet revenue forecasting
- 90-day cash flow predictions
- Payment risk dashboard

### 📅 Days 8-9: Smart Scheduling + Polish
- CSP solver for makeup sessions
- Deployment preparation

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

### 1. Clone & Start Services
```bash
git clone https://github.com/YOUR_USERNAME/TTTEnglishCenter.git
cd TTTEnglishCenter
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # Mac/Linux
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Open the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |
| ML Insights | http://localhost:3000/ml |

---

## 🗄️ Database

**Current Data:**
- 3 Teachers (Admin + 2 Teachers)
- 20 Students (Primary through High School)
- 6 Classes (IELTS, TOEFL, FCE, General English)
- 31 Enrollments (with realistic attendance/score data)

**Key Design Decisions:**
- UUID primary keys
- Soft deletes (`is_active = false`)
- Port 5433 (avoids conflict with local PostgreSQL)
- 3-category level system enforced at DB and API level

---

## 🤖 ML Features

### Attendance Prediction (Live)

**Endpoint:** `GET /api/v1/ml/attendance-summary`

**Features used:**

| Feature | Description |
|---------|-------------|
| `payment_cluster` | Risk score 0-4 (always_on_time to high_risk) |
| `grade_level` | Numeric 1-12 |
| `discount_percent` | Loyalty indicator |
| `average_score` | Academic performance |

**Sample Output:**
```json
{
  "total_enrollments": 21,
  "at_risk_count": 5,
  "confidence": "high",
  "predictions": [],
  "at_risk_students": []
}
```

---

## 📁 Project Structure

```
TTTEnglishCenter/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── teachers.py
│   │   │   ├── students.py
│   │   │   ├── classes.py
│   │   │   ├── enrollments.py
│   │   │   ├── stats.py
│   │   │   └── ml.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── main.py
│   │   └── database.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── teachers/
│   │   ├── students/
│   │   ├── classes/
│   │   ├── enrollments/
│   │   └── ml/page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── lib/api.ts
│   └── types/index.ts
├── database/
│   ├── schema.sql
│   └── seed_data.sql
└── docker-compose.yml
```

---

## 🐛 Common Issues

**Classes API returns 500:** The level field has a DB check constraint. Valid values:
`primary_1-5`, `secondary_6-9`, `high_10-12`, `starters`, `movers`, `flyers`, `ket`, `pet`, `fce`, `ielts`, `toefl`, `sat`, `general_english`

**Students/Enrollments page shows empty:** Ensure trailing slashes on API calls and response remapping (`d.students`, `d.enrollments`).

**Port 5432 conflict:** Project intentionally uses port 5433. Do not change this.

---

## 👨‍💻 Author

**Vinh Pham** — 10-week capstone project (February–April 2026)  
Building for family's tutoring center in Ho Chi Minh City, VN.

---

**Built with ❤️ for Vietnamese English teachers**

*Last Updated: February 26, 2026 — Day 6 Complete (60%)*