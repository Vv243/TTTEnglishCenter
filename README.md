# EduCore — English Tutoring Center Management System

> Production-grade management system built for a Vietnamese English tutoring center in Ho Chi Minh City. Built as a capstone portfolio project by Vinh Pham.

[![Tests](https://github.com/Vv243/TTTEnglishCenter/actions/workflows/test.yml/badge.svg)](https://github.com/Vv243/TTTEnglishCenter/actions/workflows/test.yml)

---

## 🎯 What is EduCore?

EduCore is a full-stack management platform serving a real family-operated English tutoring center (90+ students, 3 teachers) in Sài Gòn, Vietnam. It replaces manual spreadsheet tracking with a production-grade system covering student enrollment, attendance, payment collection, and ML-powered insights.

**Live demo:** Coming soon (Day 13 deployment)

---

## ✨ Key Features

### 👥 Student & Enrollment Management
- Full student profiles with Vietnamese address system (2-tier post-2025)
- Smart enrollment pipeline: `pending → enrolled → withdrawn`
- Auto-waitlist when class is full with teacher-controlled promotion
- Student deactivation auto-withdraws all active enrollments

### 📅 Class Scheduling with Conflict Detection
- Visual weekly schedule grid (Cards + Schedule views)
- Real-time conflict detection: blocks room + teacher double-booking
- Teacher permissions: create/edit own classes only
- Cancel session with auto-generated Vietnamese parent notification

### ✅ Attendance Tracking
- Per-session attendance marking (Present / Late / Absent)
- Supports regular + makeup sessions
- Past session editing, future session cancellation
- Auto-updates student attendance rates after each session

### 💰 Payment Collection
- Monthly payment tracker per class
- Bilingual Vietnamese receipts (PHIẾU THU)
- Payment forecasting with Facebook Prophet
- Payment risk scoring per student

### 🤖 ML Insights
- **Attendance Prediction** — Random Forest Classifier
- **Payment Forecasting** — Hybrid rule-based × Prophet trend multiplier
- **Payment Risk Scoring** — cluster-based risk flags
- **Smart Scheduling** — CSP backtracking solver with DAG conflict detection

### 🔐 Role-Based Access
- **Admin** — full access, manage all teachers/classes
- **Teacher** — personalized dashboard, own classes only, attendance marking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Recharts |
| **Backend** | FastAPI (Python 3.13), async SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 |
| **ML** | scikit-learn, Facebook Prophet, pandas, numpy |
| **Auth** | JWT (HS256), bcrypt |
| **Infrastructure** | Docker Compose |
| **Testing** | pytest, pytest-asyncio, httpx (60 tests) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- Python 3.13

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Vv243/TTTEnglishCenter.git
cd TTTEnglishCenter

# 2. Start Docker services
docker-compose up -d

# 3. Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# 4. Apply database schema
Get-Content database/schema.sql | docker exec -i tttenglish_postgres psql -U postgres -d tttenglish_dev
Get-Content database/seed_data.sql | docker exec -i tttenglish_postgres psql -U postgres -d tttenglish_dev

# 5. Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Default Login
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| co_mai | teacher123 | Teacher |
| co_lan | teacher123 | Teacher |
| thay_duc | teacher123 | Teacher |

---

## 🧪 Running Tests

```bash
cd backend
.\venv\Scripts\activate

# Unit tests (37 tests, no DB required)
pytest tests/test_educore.py -v

# Integration tests (22 tests, requires running backend)
pytest tests/integration/test_api.py -v

# Full suite (60 tests)
pytest tests/ -v
```

---

## 📁 Project Structure

```
TTTEnglishCenter/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── core/         # Auth, config
│   └── tests/
│       ├── test_educore.py          # 37 unit tests
│       └── integration/
│           └── test_api.py          # 22 API tests
├── frontend/
│   ├── app/(main)/       # Protected pages
│   ├── components/       # React components
│   └── lib/              # API client, auth utils
├── database/
│   ├── schema.sql         # Full DB schema
│   └── seed_data.sql      # Sample data
└── docker-compose.yml
```

---

## 🌟 What Makes EduCore Different

1. **Real production usage** — actual family business with real students
2. **ML in production** — three separate ML models (Random Forest, Prophet, CSP)
3. **Vietnamese context** — bilingual receipts, Zalo contact fields, 2-tier address system
4. **Full test coverage** — 60 tests across unit + integration + CI/CD
5. **Role-based UX** — teachers see personalized dashboard with their daily schedule

---

## 👨‍💻 Built By

**Vinh Pham** — CS Graduate, Rutgers University (Jan 2026)  
- GitHub: [@Vv243](https://github.com/Vv243)
- LinkedIn: [linkedin.com/in/vinhpham243](https://linkedin.com/in/vinhpham243)

---

## 📄 License

MIT License — see [LICENSE](LICENSE)