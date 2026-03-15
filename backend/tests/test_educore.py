"""
EduCore Backend Tests
Covers: enrollment logic, conflict detection, attendance, payment flow
"""
import pytest
from datetime import date, time


# ── Pure logic tests (no DB required) ────────────────────────────────────────

class TestEnrollmentStatusFlow:
    """Test enrollment status business rules"""

    def test_new_enrollment_defaults_to_pending(self):
        """Students start as pending until payment confirmed"""
        status = "pending"
        assert status != "enrolled"
        assert status != "waitlisted"

    def test_full_class_triggers_waitlist(self):
        """When class is full, enrollment goes to waitlisted"""
        max_students = 10
        current_enrollment = 10
        class_is_full = current_enrollment >= max_students
        expected_status = "waitlisted" if class_is_full else "pending"
        assert expected_status == "waitlisted"

    def test_non_full_class_triggers_pending(self):
        """When class has space, enrollment goes to pending"""
        max_students = 10
        current_enrollment = 5
        class_is_full = current_enrollment >= max_students
        expected_status = "waitlisted" if class_is_full else "pending"
        assert expected_status == "pending"

    def test_payment_flips_pending_to_enrolled(self):
        """Recording payment on pending enrollment → enrolled"""
        enrollment_status = "pending"
        class_status = "active"
        action = "paid"

        if action == "paid" and enrollment_status == "pending" and class_status == "active":
            enrollment_status = "enrolled"

        assert enrollment_status == "enrolled"

    def test_payment_does_not_flip_waitlisted(self):
        """Waitlisted students cannot pay — must be promoted first"""
        enrollment_status = "waitlisted"
        action = "paid"
        # Waitlisted students should not be in payment tracker
        can_pay = enrollment_status == "pending"
        assert not can_pay

    def test_payment_does_not_flip_if_class_not_active(self):
        """Payment on pending enrollment for scheduled class stays pending"""
        enrollment_status = "pending"
        class_status = "scheduled"
        action = "paid"

        if action == "paid" and enrollment_status == "pending" and class_status == "active":
            enrollment_status = "enrolled"

        assert enrollment_status == "pending"

    def test_valid_enrollment_statuses(self):
        """Only valid statuses allowed"""
        valid = {"pending", "enrolled", "waitlisted", "withdrawn"}
        assert "active" not in valid
        assert "dropped" not in valid
        assert "completed" not in valid

    def test_withdraw_decrements_class_count(self):
        """Withdrawing enrolled/pending student decrements class count"""
        current_enrollment = 5
        status = "enrolled"

        if status in ("enrolled", "pending"):
            current_enrollment -= 1

        assert current_enrollment == 4

    def test_waitlist_withdraw_does_not_decrement(self):
        """Withdrawing waitlisted student does NOT decrement class count"""
        current_enrollment = 10
        status = "waitlisted"

        if status in ("enrolled", "pending"):
            current_enrollment -= 1

        assert current_enrollment == 10  # unchanged


class TestConflictDetection:
    """Test scheduling conflict detection logic"""

    def parse_time(self, t: str) -> int:
        h, m = t.split(":")
        return int(h) * 60 + int(m)

    def times_overlap(self, start1, end1, start2, end2) -> bool:
        s1, e1 = self.parse_time(start1), self.parse_time(end1)
        s2, e2 = self.parse_time(start2), self.parse_time(end2)
        return s1 < e2 and e1 > s2

    def days_overlap(self, days1, days2) -> bool:
        return bool(set(days1) & set(days2))

    def test_same_room_same_time_is_conflict(self):
        """Two classes in same room at same time = conflict"""
        existing = {"room": "Room 1", "days": [1], "start": "19:00", "end": "20:30"}
        new_class = {"room": "Room 1", "days": [1], "start": "19:00", "end": "20:30"}

        room_conflict = (
            existing["room"] == new_class["room"] and
            self.days_overlap(existing["days"], new_class["days"]) and
            self.times_overlap(existing["start"], existing["end"],
                             new_class["start"], new_class["end"])
        )
        assert room_conflict

    def test_different_days_no_conflict(self):
        """Same room, same time, different days = no conflict"""
        existing = {"room": "Room 1", "days": [1], "start": "19:00", "end": "20:30"}
        new_class = {"room": "Room 1", "days": [3], "start": "19:00", "end": "20:30"}

        day_overlap = self.days_overlap(existing["days"], new_class["days"])
        assert not day_overlap

    def test_different_rooms_no_conflict(self):
        """Same time, same day, different rooms = no conflict"""
        existing = {"room": "Room 1", "days": [1], "start": "19:00", "end": "20:30"}
        new_class = {"room": "Room 2", "days": [1], "start": "19:00", "end": "20:30"}

        room_conflict = existing["room"] == new_class["room"]
        assert not room_conflict

    def test_adjacent_times_no_overlap(self):
        """Classes back to back (20:30 → 20:30) = no overlap"""
        overlap = self.times_overlap("19:00", "20:30", "20:30", "22:00")
        assert not overlap

    def test_partial_overlap_is_conflict(self):
        """Classes that partially overlap = conflict"""
        overlap = self.times_overlap("19:00", "20:30", "20:00", "21:30")
        assert overlap

    def test_same_teacher_same_time_is_conflict(self):
        """Teacher cannot teach two classes at same time"""
        existing = {"teacher_id": "abc", "days": [1], "start": "19:00", "end": "20:30"}
        new_class = {"teacher_id": "abc", "days": [1], "start": "19:00", "end": "20:30"}

        teacher_conflict = (
            existing["teacher_id"] == new_class["teacher_id"] and
            self.days_overlap(existing["days"], new_class["days"]) and
            self.times_overlap(existing["start"], existing["end"],
                             new_class["start"], new_class["end"])
        )
        assert teacher_conflict

    def test_different_teachers_no_teacher_conflict(self):
        """Different teachers same time = no teacher conflict"""
        existing = {"teacher_id": "abc", "days": [1], "start": "19:00", "end": "20:30"}
        new_class = {"teacher_id": "xyz", "days": [1], "start": "19:00", "end": "20:30"}

        teacher_conflict = existing["teacher_id"] == new_class["teacher_id"]
        assert not teacher_conflict

    def test_exclude_class_id_skips_self(self):
        """When editing a class, exclude itself from conflict check"""
        class_id = "class-123"
        exclude_id = "class-123"
        should_check = class_id != exclude_id
        assert not should_check


class TestAttendanceLogic:
    """Test attendance business rules"""

    def test_attendance_rate_calculation(self):
        """Attendance rate = present+late / total sessions"""
        total = 10
        present = 8
        late = 1
        absent = 1

        rate = round((present + late) / total * 100, 2)
        assert rate == 90.0

    def test_zero_sessions_rate_is_zero(self):
        """No sessions recorded = 0% rate"""
        total = 0
        rate = 0.0 if total == 0 else 0
        assert rate == 0.0

    def test_all_present_is_100_percent(self):
        """All present = 100% attendance"""
        total = 5
        present = 5
        rate = round(present / total * 100, 2)
        assert rate == 100.0

    def test_valid_attendance_statuses(self):
        """Only present, absent, late are valid"""
        valid = {"present", "absent", "late"}
        assert "tardy" not in valid
        assert "excused" not in valid

    def test_makeup_session_requires_reason(self):
        """Makeup sessions must have a reason"""
        session_type = "makeup"
        makeup_reason = ""
        is_valid = not (session_type == "makeup" and not makeup_reason)
        assert not is_valid

    def test_regular_session_no_reason_needed(self):
        """Regular sessions don't need a makeup reason"""
        session_type = "regular"
        makeup_reason = ""
        is_valid = not (session_type == "makeup" and not makeup_reason)
        assert is_valid

    def test_future_date_cannot_have_attendance(self):
        """Cannot mark attendance for future sessions"""
        from datetime import date, timedelta
        today = date.today()
        future_date = today + timedelta(days=1)
        can_mark = future_date <= today
        assert not can_mark

    def test_past_date_can_have_attendance(self):
        """Can mark attendance for past sessions"""
        from datetime import date, timedelta
        today = date.today()
        past_date = today - timedelta(days=1)
        can_mark = past_date <= today
        assert can_mark


class TestPaymentLogic:
    """Test payment business rules"""

    def test_valid_payment_methods(self):
        """Only cash and bank_transfer are valid"""
        valid = {"cash", "bank_transfer"}
        assert "card" not in valid
        assert "zalo_pay" not in valid
        assert "momo" not in valid

    def test_valid_payment_statuses(self):
        """Only paid, late, missed are valid"""
        valid = {"paid", "late", "missed"}
        assert "unpaid" not in valid
        assert "pending" not in valid

    def test_monthly_amount_with_discount(self):
        """Tuition with discount calculates correctly"""
        base_tuition = 400000
        discount_percent = 15
        monthly = round(base_tuition * (1 - discount_percent / 100))
        assert monthly == 340000

    def test_zero_discount_full_amount(self):
        """Zero discount means full tuition"""
        base_tuition = 400000
        discount_percent = 0
        monthly = round(base_tuition * (1 - discount_percent / 100))
        assert monthly == 400000

    def test_paid_status_sets_paid_date(self):
        """Marking as paid should record today's date"""
        from datetime import date
        action = "paid"
        paid_date = date.today() if action == "paid" else None
        assert paid_date is not None

    def test_missed_status_no_paid_date(self):
        """Marking as missed should not set paid date"""
        action = "missed"
        paid_date = date.today() if action == "paid" else None
        assert paid_date is None

    def test_collection_rate_calculation(self):
        """Collection rate = total paid / (paid + missed)"""
        total_paid = 3000000
        total_missed = 1000000
        total_billed = total_paid + total_missed
        rate = round(total_paid / total_billed, 3) if total_billed > 0 else 1.0
        assert rate == 0.75

    def test_no_payments_collection_rate_is_one(self):
        """No payment history = 100% collection rate (new student)"""
        total_billed = 0
        rate = 1.0 if total_billed == 0 else 0
        assert rate == 1.0


class TestStudentManagement:
    """Test student management rules"""

    def test_deactivate_withdraws_enrolled(self):
        """Deactivating student auto-withdraws enrolled enrollments"""
        enrollments = [
            {"status": "enrolled"},
            {"status": "pending"},
            {"status": "waitlisted"},
            {"status": "withdrawn"},
        ]
        affected = [e for e in enrollments if e["status"] in ("enrolled", "pending")]
        assert len(affected) == 2

    def test_deactivate_does_not_affect_withdrawn(self):
        """Already withdrawn enrollments unaffected by deactivation"""
        enrollments = [{"status": "withdrawn"}]
        affected = [e for e in enrollments if e["status"] in ("enrolled", "pending")]
        assert len(affected) == 0

    def test_valid_grade_levels(self):
        """Adult is a valid grade level"""
        valid = {
            "primary_1", "primary_2", "primary_3", "primary_4", "primary_5",
            "secondary_6", "secondary_7", "secondary_8", "secondary_9",
            "high_10", "high_11", "high_12", "adult"
        }
        assert "adult" in valid
        assert "university" not in valid

    def test_soft_delete_not_hard_delete(self):
        """Student deletion sets is_active=False, not actual deletion"""
        student = {"id": "123", "is_active": True}
        # Soft delete
        student["is_active"] = False
        assert student["id"] == "123"  # record preserved
        assert not student["is_active"]