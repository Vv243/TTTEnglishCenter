"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api, { mlAPI } from "@/lib/api";
import { AlertTriangle, Brain, TrendingUp, Users, CheckCircle, Calendar, Download, RefreshCw } from "lucide-react";

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

interface ScheduleItem {
  class_id: string;
  class_name: string;
  level: string;
  teacher_name: string;
  day: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  room_capacity: number;
}

interface ScheduleData {
  schedule: ScheduleItem[];
  conflicts: { class_id: string; class_name: string; reason: string }[];
  stats: { total: number; scheduled: number; unscheduled: number; teachers_involved: number };
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

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-blue-50 text-blue-700",
  Tuesday: "bg-purple-50 text-purple-700",
  Wednesday: "bg-green-50 text-green-700",
  Thursday: "bg-orange-50 text-orange-700",
  Friday: "bg-pink-50 text-pink-700",
  Saturday: "bg-amber-50 text-amber-700",
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

function exportScheduleToCSV(schedule: ScheduleItem[], generatedAt: Date) {
  const header = ["Class Name", "Level", "Teacher", "Day", "Start Time", "End Time", "Duration (min)", "Capacity"];
  const rows = schedule.map((item) => [
    item.class_name,
    item.level.replace(/_/g, " ").toUpperCase(),
    item.teacher_name,
    item.day,
    item.start_time,
    item.end_time,
    item.duration_minutes,
    item.room_capacity,
  ]);

  const csvContent = [
    `# TTT English Center — Generated Schedule`,
    `# Generated: ${generatedAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`,
    `# ${schedule.length} classes · No teacher conflicts`,
    "",
    header.join(","),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `TTT_Schedule_${generatedAt.toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MLInsightsPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "at-risk">("at-risk");
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/ml/attendance-summary/");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch ML data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateSchedule = async () => {
    setScheduleLoading(true);
    setJustRegenerated(false);
    try {
      const result = await mlAPI.getSchedule();
      setSchedule(result);
      setGeneratedAt(new Date());
      setJustRegenerated(true);
      // Clear the "just regenerated" flash after 2s
      setTimeout(() => setJustRegenerated(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleLoading(false);
    }
  };

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
        <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Risk Distribution</h2>
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
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("at-risk")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "at-risk" ? "text-red-600 border-b-2 border-red-500 bg-red-50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ⚠️ At-Risk ({data.at_risk_count})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "all" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Predictions ({data.total_enrollments})
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Student", "Payment Cluster", "Current", "Predicted", "Risk"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((p) => (
                <tr key={p.enrollment_id} className="hover:bg-slate-50 transition-colors">
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
                        <span className={`font-mono font-bold ${getAttendanceTextColor(p.current_attendance)}`}>{p.current_attendance}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getAttendanceColor(p.current_attendance)}`} style={{ width: `${p.current_attendance}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No data</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${getAttendanceTextColor(p.predicted_attendance)}`}>{p.predicted_attendance}%</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getAttendanceColor(p.predicted_attendance)}`} style={{ width: `${p.predicted_attendance}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.risk_flag ? (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium"><AlertTriangle className="h-3 w-3" /> At Risk</span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="h-3 w-3" /> On Track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── CSP Schedule Generator ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Smart Schedule Generator</h2>
              <p className="text-sm text-slate-500">CSP solver with backtracking + DAG conflict detection</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export button — only shown when schedule exists */}
            {schedule && (
              <button
                onClick={() => exportScheduleToCSV(schedule.schedule, generatedAt!)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}

            {/* Generate / Re-run button */}
            <button
              onClick={generateSchedule}
              disabled={scheduleLoading}
              className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
                justRegenerated
                  ? "bg-green-500 text-white"
                  : scheduleLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : schedule
                  ? "bg-slate-800 hover:bg-slate-700 text-white"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-900"
              }`}
            >
              {scheduleLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : justRegenerated ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Schedule Updated!
                </>
              ) : schedule ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-run Schedule
                </>
              ) : (
                <>
                  ⚡ Generate Schedule
                </>
              )}
            </button>
          </div>
        </div>

        {!schedule && !scheduleLoading && (
          <Card className="p-8 text-center border-dashed">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Click Generate Schedule to run the CSP solver across all active classes</p>
          </Card>
        )}

        {schedule && (
          <>
            {/* Stats + timestamp row */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {[
                { label: "Total Classes", value: schedule.stats.total },
                { label: "Scheduled", value: schedule.stats.scheduled, color: "text-green-600" },
                { label: "Conflicts", value: schedule.stats.unscheduled, color: "text-red-500" },
                { label: "Teachers", value: schedule.stats.teachers_involved },
              ].map(stat => (
                <Card key={stat.label} className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color ?? "text-slate-900"}`}>{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Timetable */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Generated Timetable</h3>
                  {generatedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Last generated: {generatedAt.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{schedule.stats.scheduled} classes · no teacher conflicts</span>
                  {/* Inline export link for convenience */}
                  <button
                    onClick={() => exportScheduleToCSV(schedule.schedule, generatedAt!)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <Download className="h-3 w-3" />
                    Download CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Day", "Time", "Class", "Level", "Teacher", "Duration", "Capacity"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedule.schedule
                      .slice()
                      .sort((a, b) => {
                        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                        const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                        if (dayDiff !== 0) return dayDiff;
                        return a.start_time.localeCompare(b.start_time);
                      })
                      .map((item) => (
                        <tr key={item.class_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${DAY_COLORS[item.day] ?? "bg-slate-100 text-slate-600"}`}>
                              {item.day}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.start_time} – {item.end_time}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.class_name}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">
                              {item.level.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.teacher_name}</td>
                          <td className="px-4 py-3 text-slate-500">{item.duration_minutes}m</td>
                          <td className="px-4 py-3 text-slate-500">{item.room_capacity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {schedule.conflicts.length > 0 && (
                <div className="px-6 py-4 border-t border-red-100 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-2">⚠️ Could not schedule {schedule.conflicts.length} class(es):</p>
                  {schedule.conflicts.map(c => (
                    <p key={c.class_id} className="text-xs text-red-600">{c.class_name} — {c.reason}</p>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}