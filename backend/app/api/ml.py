from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import date, timedelta
import warnings
warnings.filterwarnings('ignore')

from app.database import get_db
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.payment_history import PaymentHistory

router = APIRouter(prefix="/ml", tags=["ML Predictions"])

# ============================================================
# CONSTANTS
# ============================================================

CLUSTER_RISK = {
    "always_on_time": 0,
    "new_student": 1,
    "needs_reminder": 2,
    "erratic": 3,
    "high_risk": 4,
}

# Payment collection probability by cluster (for hybrid forecast)
CLUSTER_COLLECTION_RATE = {
    "always_on_time": 0.95,
    "new_student":    0.80,
    "needs_reminder": 0.75,
    "erratic":        0.55,
    "high_risk":      0.30,
}

GRADE_ORDER = {
    "primary_1": 1, "primary_2": 2, "primary_3": 3, "primary_4": 4, "primary_5": 5,
    "secondary_6": 6, "secondary_7": 7, "secondary_8": 8, "secondary_9": 9,
    "high_10": 10, "high_11": 11, "high_12": 12, "adult": 13,
}

GRADE_TUITION = {
    "primary_1": 800000, "primary_2": 800000, "primary_3": 800000,
    "primary_4": 800000, "primary_5": 800000,
    "secondary_6": 1000000, "secondary_7": 1000000,
    "secondary_8": 1000000, "secondary_9": 1000000,
    "high_10": 1200000, "high_11": 1200000, "high_12": 1200000,
    "adult": 1500000,
}

# ============================================================
# ATTENDANCE PREDICTION (Day 6 — unchanged)
# ============================================================

async def get_training_data(db: AsyncSession):
    result = await db.execute(
        select(Enrollment, Student)
        .join(Student, Enrollment.student_id == Student.id)
        .where(Enrollment.attendance_rate.isnot(None))
        .where(Enrollment.attendance_rate > 0)
    )
    rows = result.all()

    records = []
    for enrollment, student in rows:
        records.append({
            "attendance_rate": float(enrollment.attendance_rate),
            "cluster_risk": CLUSTER_RISK.get(student.payment_cluster, 2),
            "grade_numeric": GRADE_ORDER.get(student.grade_level, 6),
            "discount_percent": float(enrollment.discount_percent or 0),
            "average_score": float(enrollment.average_score) if enrollment.average_score else 7.0,
        })

    return pd.DataFrame(records)


def train_model(df: pd.DataFrame) -> RandomForestRegressor:
    features = ["cluster_risk", "grade_numeric", "discount_percent", "average_score"]
    X = df[features]
    y = df["attendance_rate"]
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=5)
    model.fit(X, y)
    return model


@router.get("/predict-attendance/{enrollment_id}")
async def predict_attendance(enrollment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Enrollment, Student)
        .join(Student, Enrollment.student_id == Student.id)
        .where(Enrollment.id == enrollment_id)
    )
    row = result.first()
    if not row:
        return {"error": "Enrollment not found"}

    enrollment, student = row
    df = await get_training_data(db)
    if len(df) < 5:
        return {"error": "Insufficient training data", "min_required": 5}

    model = train_model(df)
    features = pd.DataFrame([{
        "cluster_risk": CLUSTER_RISK.get(student.payment_cluster, 2),
        "grade_numeric": GRADE_ORDER.get(student.grade_level, 6),
        "discount_percent": float(enrollment.discount_percent or 0),
        "average_score": float(enrollment.average_score) if enrollment.average_score else 7.0,
    }])

    predicted = float(model.predict(features)[0])
    predicted = max(0, min(100, predicted))

    feature_names = ["cluster_risk", "grade_numeric", "discount_percent", "average_score"]
    importance = dict(zip(feature_names, model.feature_importances_.tolist()))

    return {
        "enrollment_id": enrollment_id,
        "student_name": student.full_name,
        "payment_cluster": student.payment_cluster,
        "current_attendance": float(enrollment.attendance_rate) if enrollment.attendance_rate else None,
        "predicted_attendance": round(predicted, 1),
        "confidence": "high" if len(df) >= 20 else "medium" if len(df) >= 10 else "low",
        "training_samples": len(df),
        "feature_importance": importance,
    }


@router.get("/attendance-summary")
async def attendance_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Enrollment, Student)
        .join(Student, Enrollment.student_id == Student.id)
        .where(Enrollment.status == "active")
    )
    all_enrollments = result.all()

    df = await get_training_data(db)
    if len(df) < 5:
        return {"error": "Insufficient training data"}

    model = train_model(df)
    predictions = []

    for enrollment, student in all_enrollments:
        features = pd.DataFrame([{
            "cluster_risk": CLUSTER_RISK.get(student.payment_cluster, 2),
            "grade_numeric": GRADE_ORDER.get(student.grade_level, 6),
            "discount_percent": float(enrollment.discount_percent or 0),
            "average_score": float(enrollment.average_score) if enrollment.average_score else 7.0,
        }])

        predicted = float(model.predict(features)[0])
        predicted = max(0, min(100, predicted))

        predictions.append({
            "enrollment_id": str(enrollment.id),
            "student_name": student.full_name,
            "payment_cluster": student.payment_cluster,
            "current_attendance": float(enrollment.attendance_rate) if enrollment.attendance_rate else None,
            "predicted_attendance": round(predicted, 1),
            "risk_flag": predicted < 70,
        })

    predictions.sort(key=lambda x: x["predicted_attendance"])
    at_risk = [p for p in predictions if p["risk_flag"]]

    return {
        "total_enrollments": len(predictions),
        "at_risk_count": len(at_risk),
        "training_samples": len(df),
        "confidence": "high" if len(df) >= 20 else "medium",
        "predictions": predictions,
        "at_risk_students": at_risk,
    }


# ============================================================
# PAYMENT FORECAST (Day 7)
# Hybrid approach: rule-based core + Prophet trend adjustment
# ============================================================

def _get_monthly_actuals(payment_rows: list) -> pd.DataFrame:
    """Aggregate payment_history rows into monthly revenue totals."""
    records = []
    for ph, student in payment_rows:
        # Only count actually collected payments (paid or late — money came in)
        if ph.status in ("paid", "late") and ph.paid_date:
            records.append({
                "ds": pd.Timestamp(ph.paid_date).to_period("M").to_timestamp(),
                "amount": float(ph.amount),
            })

    if not records:
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(records)
    monthly = df.groupby("ds")["amount"].sum().reset_index()
    monthly.columns = ["ds", "y"]
    monthly = monthly.sort_values("ds").reset_index(drop=True)
    return monthly


def _prophet_trend_multiplier(monthly_df: pd.DataFrame, periods: int = 3) -> float:
    """
    Fit Prophet on historical monthly revenue.
    Return the average growth multiplier over the next `periods` months.
    Falls back to 1.0 (no adjustment) if Prophet fails or data is too sparse.
    """
    try:
        from prophet import Prophet

        if len(monthly_df) < 3:
            return 1.0

        m = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.1,
        )
        m.fit(monthly_df)

        last_date = monthly_df["ds"].max()
        future_dates = pd.DataFrame({
            "ds": [last_date + pd.DateOffset(months=i) for i in range(1, periods + 1)]
        })
        forecast = m.predict(future_dates)

        avg_historical = monthly_df["y"].mean()
        avg_forecast   = forecast["yhat"].mean()

        if avg_historical <= 0:
            return 1.0

        multiplier = avg_forecast / avg_historical
        # Clamp to reasonable range: -20% to +30%
        return max(0.80, min(1.30, multiplier))

    except Exception:
        return 1.0  # graceful fallback


@router.get("/payment-forecast")
async def payment_forecast(db: AsyncSession = Depends(get_db)):
    """
    90-day revenue forecast using hybrid approach:
    1. Rule-based: active students × tuition × collection probability by cluster
    2. Prophet trend multiplier applied on top
    Returns monthly breakdown for next 3 months + historical actuals.
    """

    # --- 1. Fetch historical payment data ---
    hist_result = await db.execute(
        select(PaymentHistory, Student)
        .join(Student, PaymentHistory.student_id == Student.id)
        .where(Student.is_active == True)
        .order_by(PaymentHistory.due_date)
    )
    payment_rows = hist_result.all()

    monthly_actuals = _get_monthly_actuals(payment_rows)

    # --- 2. Fetch active students for rule-based forecast ---
    students_result = await db.execute(
        select(Student).where(Student.is_active == True)
    )
    active_students = students_result.scalars().all()

    # --- 3. Rule-based monthly expected revenue ---
    rule_based_monthly = 0.0
    for student in active_students:
        tuition      = GRADE_TUITION.get(student.grade_level, 1000000)
        collection   = CLUSTER_COLLECTION_RATE.get(student.payment_cluster, 0.75)
        rule_based_monthly += tuition * collection

    # --- 4. Prophet trend multiplier ---
    trend_multiplier = _prophet_trend_multiplier(monthly_actuals)

    # --- 5. Build 3-month forecast ---
    today = date.today()
    forecast_months = []
    for i in range(1, 4):
        month_start = (today.replace(day=1) + timedelta(days=32 * i)).replace(day=1)
        expected    = rule_based_monthly * trend_multiplier
        lower       = expected * 0.85
        upper       = expected * 1.15

        forecast_months.append({
            "month": month_start.strftime("%Y-%m"),
            "month_label": month_start.strftime("%B %Y"),
            "expected_revenue": round(expected),
            "lower_bound":      round(lower),
            "upper_bound":      round(upper),
        })

    # --- 6. Format historical actuals for chart ---
    historical = []
    for _, row in monthly_actuals.iterrows():
        historical.append({
            "month":   row["ds"].strftime("%Y-%m"),
            "month_label": row["ds"].strftime("%B %Y"),
            "actual_revenue": round(row["y"]),
        })

    # --- 7. Summary stats ---
    total_expected_90d = sum(m["expected_revenue"] for m in forecast_months)
    avg_historical     = round(monthly_actuals["y"].mean()) if not monthly_actuals.empty else 0

    return {
        "summary": {
            "active_students":       len(active_students),
            "rule_based_monthly":    round(rule_based_monthly),
            "trend_multiplier":      round(trend_multiplier, 3),
            "expected_next_month":   forecast_months[0]["expected_revenue"] if forecast_months else 0,
            "total_expected_90_days": total_expected_90d,
            "avg_historical_monthly": avg_historical,
            "forecast_method": "Hybrid: Rule-based × Prophet trend",
        },
        "historical_actuals": historical,
        "forecast": forecast_months,
    }


@router.get("/payment-risk")
async def payment_risk(db: AsyncSession = Depends(get_db)):
    """
    Rank active students by payment risk.
    Uses payment history + cluster to flag who is likely to miss next payment.
    """

    # Fetch all active students with their payment history
    result = await db.execute(
        select(Student).where(Student.is_active == True)
    )
    active_students = result.scalars().all()

    student_ids = [s.id for s in active_students]

    # Fetch recent payment history (last 3 months)
    three_months_ago = date.today() - timedelta(days=90)
    hist_result = await db.execute(
        select(PaymentHistory)
        .where(PaymentHistory.student_id.in_(student_ids))
        .where(PaymentHistory.due_date >= three_months_ago)
        .order_by(PaymentHistory.due_date.desc())
    )
    recent_payments = hist_result.scalars().all()

    # Group by student
    from collections import defaultdict
    payments_by_student = defaultdict(list)
    for ph in recent_payments:
        payments_by_student[ph.student_id].append(ph)

    risk_list = []
    for student in active_students:
        cluster      = student.payment_cluster or "new_student"
        base_rate    = CLUSTER_COLLECTION_RATE.get(cluster, 0.75)
        tuition      = GRADE_TUITION.get(student.grade_level, 1000000)
        history      = payments_by_student.get(student.id, [])

        # Calculate actual recent miss rate from history
        if history:
            missed_count = sum(1 for p in history if p.status == "missed")
            late_count   = sum(1 for p in history if p.status == "late")
            total        = len(history)
            miss_rate    = missed_count / total
            late_rate    = late_count / total

            # Blend cluster base rate with actual recent behavior
            actual_collection = 1 - miss_rate - (late_rate * 0.3)
            collection_rate   = (base_rate * 0.4) + (actual_collection * 0.6)
        else:
            miss_rate       = 0
            late_rate       = 0
            collection_rate = base_rate

        collection_rate = max(0.0, min(1.0, collection_rate))
        risk_score      = 1 - collection_rate  # higher = more at risk

        # Risk tier
        if risk_score >= 0.60:
            risk_level = "high"
        elif risk_score >= 0.35:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Reason string
        if miss_rate > 0.4:
            reason = f"Missed {int(miss_rate*100)}% of recent payments"
        elif late_rate > 0.5:
            reason = f"Late on {int(late_rate*100)}% of recent payments"
        elif cluster == "high_risk":
            reason = "Historically high-risk payment cluster"
        elif cluster == "erratic":
            reason = "Erratic payment history"
        else:
            reason = "On track"

        risk_list.append({
            "student_id":        str(student.id),
            "student_name":      student.full_name,
            "payment_cluster":   cluster,
            "grade_level":       student.grade_level,
            "monthly_tuition":   tuition,
            "collection_rate":   round(collection_rate, 2),
            "risk_score":        round(risk_score, 2),
            "risk_level":        risk_level,
            "reason":            reason,
            "recent_missed":     sum(1 for p in history if p.status == "missed"),
            "recent_late":       sum(1 for p in history if p.status == "late"),
            "recent_paid":       sum(1 for p in history if p.status == "paid"),
            "expected_payment":  round(tuition * collection_rate),
        })

    # Sort by risk score descending
    risk_list.sort(key=lambda x: x["risk_score"], reverse=True)

    high_risk   = [r for r in risk_list if r["risk_level"] == "high"]
    medium_risk = [r for r in risk_list if r["risk_level"] == "medium"]
    low_risk    = [r for r in risk_list if r["risk_level"] == "low"]

    total_expected = sum(r["expected_payment"] for r in risk_list)
    total_billed   = sum(GRADE_TUITION.get(s.grade_level, 1000000) for s in active_students)

    return {
        "summary": {
            "total_students":      len(risk_list),
            "high_risk_count":     len(high_risk),
            "medium_risk_count":   len(medium_risk),
            "low_risk_count":      len(low_risk),
            "total_billed_vnd":    total_billed,
            "total_expected_vnd":  total_expected,
            "expected_collection_rate": round(total_expected / total_billed, 2) if total_billed > 0 else 0,
        },
        "students": risk_list,
        "high_risk":   high_risk,
        "medium_risk": medium_risk,
    }