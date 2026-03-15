"""
EduCore API Integration Tests
Tests actual FastAPI endpoints against the dev database.
Each test rolls back — no permanent data changes.
"""
import pytest
import pytest_asyncio


def auth(token):
    """Helper to create auth headers."""
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestAuth:
    async def test_login_admin_success(self, client):
        resp = await client.post("/api/v1/auth/login?username=admin&password=admin123")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"

    async def test_login_teacher_success(self, client):
        resp = await client.post("/api/v1/auth/login?username=co_mai&password=teacher123")
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "teacher"

    async def test_login_wrong_password(self, client):
        resp = await client.post("/api/v1/auth/login?username=admin&password=wrongpass")
        assert resp.status_code == 401

    async def test_me_returns_user(self, client, admin_token):
        resp = await client.get("/api/v1/auth/me", headers=auth(admin_token))
        assert resp.status_code == 200
        assert resp.json()["username"] == "admin"

    async def test_me_requires_auth(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    async def test_teacher_has_teacher_id(self, client, teacher_token):
        resp = await client.get("/api/v1/auth/me", headers=auth(teacher_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "teacher"
        assert data["teacher_id"] is not None


# ── Student Tests ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestStudents:
    async def test_get_active_students(self, client, admin_token):
        resp = await client.get(
            "/api/v1/students/?is_active=true",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "students" in data
        assert data["total"] > 0
        for s in data["students"]:
            assert s["is_active"] is True

    async def test_create_student(self, client, admin_token):
        payload = {
            "full_name": "Test Student API",
            "date_of_birth": "2010-01-01",
            "grade_level": "secondary_7",
            "parent_name": "Test Parent",
            "parent_phone": "0909123456",
        }
        resp = await client.post(
            "/api/v1/students/",
            json=payload,
            headers=auth(admin_token)
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["full_name"] == "Test Student API"
        assert data["is_active"] is True

    async def test_adult_grade_level_valid(self, client, admin_token):
        payload = {
            "full_name": "Adult Learner Test",
            "date_of_birth": "1990-06-15",
            "grade_level": "adult",
            "parent_name": "Self",
            "parent_phone": "0909999999",
        }
        resp = await client.post(
            "/api/v1/students/",
            json=payload,
            headers=auth(admin_token)
        )
        assert resp.status_code == 201
        assert resp.json()["grade_level"] == "adult"


# ── Class Tests ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestClasses:
    async def test_get_classes(self, client, admin_token):
        resp = await client.get("/api/v1/classes/", headers=auth(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "classes" in data
        assert data["total"] >= 5

    async def test_schedule_grid_returns_classes(self, client, admin_token):
        resp = await client.get(
            "/api/v1/classes/schedule-grid/",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        classes = resp.json()
        assert len(classes) >= 5
        for cls in classes:
            assert "class_id" in cls
            assert "days_of_week" in cls
            assert "start_time" in cls

    async def test_conflict_check_detects_room_conflict(self, client, admin_token):
        resp = await client.post(
            "/api/v1/classes/check-conflict/",
            json={
                "teacher_id": "550e8400-e29b-41d4-a716-446655440000",
                "room_number": "Room 1",
                "days_of_week": [1],
                "start_time": "19:00",
                "end_time": "20:30",
                "exclude_class_id": None,
            },
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["has_conflict"] is True
        assert any(c["type"] == "room" for c in data["conflicts"])

    async def test_conflict_check_no_conflict_different_day(self, client, admin_token):
        resp = await client.post(
            "/api/v1/classes/check-conflict/",
            json={
                "teacher_id": "550e8400-e29b-41d4-a716-446655440000",
                "room_number": "Room 1",
                "days_of_week": [3],
                "start_time": "19:00",
                "end_time": "20:30",
                "exclude_class_id": None,
            },
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["has_conflict"] is False


# ── Enrollment Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestEnrollments:
    async def test_get_enrollments(self, client, admin_token):
        resp = await client.get("/api/v1/enrollments/", headers=auth(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "enrollments" in data
        assert data["total"] > 0

    async def test_enrolled_status_filter(self, client, admin_token):
        resp = await client.get(
            "/api/v1/enrollments/?status=enrolled",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        for e in data["enrollments"]:
            assert e["status"] == "enrolled"

    async def test_no_active_status_exists(self, client, admin_token):
        resp = await client.get(
            "/api/v1/enrollments/?status=active",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ── Attendance Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestAttendance:
    async def test_today_classes_admin(self, client, admin_token):
        resp = await client.get(
            "/api/v1/attendance/today/",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_today_classes_teacher_filtered(self, client, teacher_token):
        resp = await client.get(
            "/api/v1/attendance/today/?target_date=2026-03-16",
            headers=auth(teacher_token)
        )
        assert resp.status_code == 200
        classes = resp.json()
        assert len(classes) <= 2

    async def test_session_attendance_returns_structure(self, client, admin_token):
        classes_resp = await client.get(
            "/api/v1/classes/schedule-grid/",
            headers=auth(admin_token)
        )
        first_class = classes_resp.json()[0]
        class_id = first_class["class_id"]
        resp = await client.get(
            f"/api/v1/attendance/session/?class_id={class_id}&session_date=2026-03-10",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "class_id" in data
        assert "already_recorded" in data
        assert "records" in data


# ── Payment Tests ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestPayments:
    async def test_monthly_tracker_returns_classes(self, client, admin_token):
        resp = await client.get(
            "/api/v1/payments/monthly-tracker/?month_year=2026-03",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "classes" in data
        assert "summary" in data
        assert data["month_label"] == "March 2026"

    async def test_stats_active_enrollments_count(self, client, admin_token):
        resp = await client.get(
            "/api/v1/stats/summary/",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "active_enrollments" in data
        assert data["active_enrollments"] > 0

    async def test_ml_attendance_summary(self, client, admin_token):
        resp = await client.get(
            "/api/v1/ml/attendance-summary/",
            headers=auth(admin_token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_enrollments"] > 0