from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

from app.database import get_db
from app.models.enrollment import Enrollment
from app.models.student import Student

router = APIRouter(prefix="/ml", tags=["ML Predictions"])

# Payment cluster → numeric risk score
CLUSTER_RISK = {
    "always_on_time": 0,
    "new_student": 1,
    "needs_reminder": 2,
    "erratic": 3,
    "high_risk": 4,
}

# Grade level → numeric (primary < secondary < high)
GRADE_ORDER = {
    "primary_1": 1, "primary_2": 2, "primary_3": 3, "primary_4": 4, "primary_5": 5,
    "secondary_6": 6, "secondary_7": 7, "secondary_8": 8, "secondary_9": 9,
    "high_10": 10, "high_11": 11, "high_12": 12,
}

LEVEL_ORDER = {
    "general_english": 1,
    "starters": 2, "movers": 3, "flyers": 4,
    "ket": 5, "pet": 6, "fce": 7,
    "ielts": 8, "toefl": 9, "sat": 10,
    "primary_1": 1, "primary_2": 1, "primary_3": 1, "primary_4": 1, "primary_5": 1,
    "secondary_6": 2, "secondary_7": 2, "secondary_8": 2, "secondary_9": 2,
    "high_10": 3, "high_11": 3, "high_12": 3,
}


async def get_training_data(db: AsyncSession):
    """Fetch all enrollments with student data for training."""
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
    # Get the target enrollment + student
    result = await db.execute(
        select(Enrollment, Student)
        .join(Student, Enrollment.student_id == Student.id)
        .where(Enrollment.id == enrollment_id)
    )
    row = result.first()
    if not row:
        return {"error": "Enrollment not found"}

    enrollment, student = row

    # Get training data
    df = await get_training_data(db)
    if len(df) < 5:
        return {"error": "Insufficient training data", "min_required": 5}

    # Train model
    model = train_model(df)

    # Predict for this enrollment
    features = pd.DataFrame([{
        "cluster_risk": CLUSTER_RISK.get(student.payment_cluster, 2),
        "grade_numeric": GRADE_ORDER.get(student.grade_level, 6),
        "discount_percent": float(enrollment.discount_percent or 0),
        "average_score": float(enrollment.average_score) if enrollment.average_score else 7.0,
    }])

    predicted = float(model.predict(features)[0])
    predicted = max(0, min(100, predicted))  # clamp 0-100

    # Feature importance
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
    """Predict attendance for ALL active enrollments at once."""
    # Get all active enrollments
    result = await db.execute(
        select(Enrollment, Student)
        .join(Student, Enrollment.student_id == Student.id)
        .where(Enrollment.status == "active")
    )
    all_enrollments = result.all()

    # Get training data
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

    # Sort by predicted attendance ascending (at-risk first)
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