import asyncio
from typing import List, Dict, Any

import pandas as pd
from sklearn.ensemble import IsolationForest

from app.core.logging_config import get_logger

logger = get_logger("app.ai.scanner")

_REQUIRED_COLS = {"student_id", "status", "day_of_week"}


def _detect_pattern(row: Dict[str, Any], total_absences: int) -> tuple[str, Dict[str, int]]:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    breakdown = {}
    for d in days:
        cnt = int(row.get(d, 0))
        short_name = d[:3]
        breakdown[short_name] = cnt

    if total_absences <= 0:
        return "Regular Attendance", breakdown

    mon_fri = int(row.get("Monday", 0)) + int(row.get("Friday", 0))
    if mon_fri / total_absences >= 0.50 and total_absences >= 4:
        return "Long-Weekend Pattern (Mon/Fri)", breakdown

    for d in days:
        cnt = int(row.get(d, 0))
        if cnt / total_absences >= 0.40 and cnt >= 3:
            pct = int((cnt / total_absences) * 100)
            return f"{d} Concentrated ({pct}%)", breakdown

    if total_absences >= 20:
        return "Chronic High-Volume Defaulter", breakdown

    return "Irregular Multi-Day Skipping", breakdown


def _run_isolation_forest(attendance_records: List[Dict[str, Any]], contamination: float) -> List[Dict[str, Any]]:
    try:
        if not attendance_records:
            return []

        df = pd.DataFrame(attendance_records)
        if not _REQUIRED_COLS.issubset(df.columns):
            logger.error("Missing required columns in attendance records. Required: %s", _REQUIRED_COLS)
            return []

        absences = df[df["status"] == "Absent"]
        if absences.empty:
            return []

        profile = absences.groupby("student_id").size().reset_index(name="total_absences")
        day_absences = pd.crosstab(absences["student_id"], absences["day_of_week"]).reset_index()
        profile = pd.merge(profile, day_absences, on="student_id", how="left").fillna(0)

        features = profile.drop(columns=["student_id"])
        model = IsolationForest(n_estimators=100, contamination=contamination, random_state=42)
        model.fit(features)

        profile["pred"] = model.predict(features)
        profile["anomaly_score"] = -model.decision_function(features)

        flagged = profile[profile["pred"] == -1].copy()
        flagged = flagged.sort_values(by="total_absences", ascending=False).drop(columns=["pred"])

        raw_records = flagged.to_dict(orient="records")
        enriched_results = []
        for rec in raw_records:
            tot = int(rec.get("total_absences", 0))
            pattern_label, day_map = _detect_pattern(rec, tot)
            enriched_results.append(
                {
                    "student_id": rec["student_id"],
                    "total_absences": tot,
                    "anomaly_score": float(rec.get("anomaly_score", 0.0)),
                    "primary_pattern": pattern_label,
                    "day_breakdown": day_map,
                }
            )
        return enriched_results

    except Exception as e:
        logger.error("Error in IsolationForest absentee scan: %s", e, exc_info=True)
        return []


async def run_absentee_scan(
    attendance_records: List[Dict[str, Any]], contamination: float = 0.10
) -> List[Dict[str, Any]]:
    try:
        flagged = await asyncio.to_thread(_run_isolation_forest, attendance_records, contamination)
        if flagged:
            logger.info("Absentee scan: %d at-risk students", len(flagged))
        return flagged
    except Exception as e:
        logger.error("Failed to run async absentee scan wrapper: %s", e, exc_info=True)
        return []
