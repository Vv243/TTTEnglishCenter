"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { AlertTriangle, Brain, TrendingUp, Users, CheckCircle } from "lucide-react";

interface Prediction {
  enrollment_id: string;
  student_name: string;
  payment_cluster: string;
  current_attendance: number | null;
  predicted_attendance: number;
  risk_flag: boolean;
}

interface SummaryData {
  total_enrollments: number;
  at_risk_count: number;
  training_samples: number;
  confidence: string;
  predictions: Prediction[];
  at_risk_students: Prediction[];
}

const CLUSTER_LABELS: Record<string, string> = {
  always_on_time: "Always On Time",
  new_student: "New Student",
  needs_reminder: "Needs Reminder",
  erratic: "Erratic",
  high_risk: "High Risk",
};

const CLUSTER_COLORS: Record<string, string> = {
  always_on_time: "bg-green-100 text-green-700",
  new_student: "bg-blue-100 text-blue-700",
  needs_reminder: "bg-yellow-100 text-yellow-700",
  erratic: "bg-orange-100 text-orange-700",
  high_risk: "bg-red-100 text-red-700",
};

const getAttendanceColor = (rate: number) => {
  if (rate >= 85) return "bg-green-500";
  if (rate >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

const getAttendanceTextColor = (rate: number) => {
  if (rate >= 85) return "text-green-600";
  if (rate >= 70) return "text-yellow-600";
  return "text-red-600";
};

export default function MLInsightsPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "at-risk">("at-risk");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/ml/attendance-summary/");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch ML data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-12 w-12 text-amber-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-500">Training model & generating predictions...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-slate-500">Failed to load ML data.</div>;

  const displayed = activeTab === "at-risk" ? data.at_risk_students : data.predictions;
  const safeCount = data.total_enrollments - data.at_risk_count;
  const avgPredicted = data.predictions.length
    ? Math.round(data.predictions.reduce((s, p) => s + p.predicted_attendance, 0) / data.predictions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-amber-500" />
          <h1 className="text-4xl font-bold text-slate-900">ML Insights</h1>
        </div>
        <p className="text-slate-600">
          Attendance predictions powered by Random Forest · {data.training_samples} training samples · Confidence:{" "}
          <span className="font-semibold text-amber-600 capitalize">{data.confidence}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.total_enrollments}</p>
              <p className="text-xs text-slate-500">Total Enrollments</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{data.at_risk_count}</p>
              <p className="text-xs text-red-500">At-Risk Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{safeCount}</p>
              <p className="text-xs text-green-500">On Track</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{avgPredicted}%</p>
              <p className="text-xs text-slate-500">Avg Predicted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Distribution Bar */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">
          Risk Distribution
        </h2>
        <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
          <div
            className="bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${(data.at_risk_count / data.total_enrollments) * 100}%` }}
          >
            {data.at_risk_count > 0 && `${data.at_risk_count} at risk`}
          </div>
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${(safeCount / data.total_enrollments) * 100}%` }}
          >
            {safeCount} on track
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Below 70% predicted</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> 70%+ predicted</span>
        </div>
      </Card>

      {/* Predictions Table */}
      <Card className="overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("at-risk")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "at-risk"
                ? "text-red-600 border-b-2 border-red-500 bg-red-50"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ⚠️ At-Risk ({data.at_risk_count})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "text-amber-600 border-b-2 border-amber-500"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Predictions ({data.total_enrollments})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Cluster</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Predicted</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((p, i) => (
                <tr key={p.enrollment_id} className="hover:bg-slate-50 transition-colors"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${p.risk_flag ? "bg-red-500" : "bg-green-500"}`}>
                        {p.student_name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{p.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CLUSTER_COLORS[p.payment_cluster] || "bg-slate-100 text-slate-600"}`}>
                      {CLUSTER_LABELS[p.payment_cluster] || p.payment_cluster}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.current_attendance !== null ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${getAttendanceTextColor(p.current_attendance)}`}>
                          {p.current_attendance}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getAttendanceColor(p.current_attendance)}`}
                            style={{ width: `${p.current_attendance}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${getAttendanceTextColor(p.predicted_attendance)}`}>
                        {p.predicted_attendance}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getAttendanceColor(p.predicted_attendance)}`}
                          style={{ width: `${p.predicted_attendance}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.risk_flag ? (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                        <AlertTriangle className="h-3 w-3" /> At Risk
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-3 w-3" /> On Track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}