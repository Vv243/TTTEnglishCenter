"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import PaymentTrackerTab from "@/components/ui/PaymentTrackerTab";

// ── Types ────────────────────────────────────────────────────
interface ForecastSummary {
  active_students: number;
  rule_based_monthly: number;
  trend_multiplier: number;
  expected_next_month: number;
  total_expected_90_days: number;
  avg_historical_monthly: number;
  forecast_method: string;
}

interface HistoricalMonth {
  month: string;
  month_label: string;
  actual_revenue: number;
}

interface ForecastMonth {
  month: string;
  month_label: string;
  expected_revenue: number;
  lower_bound: number;
  upper_bound: number;
}

interface ForecastData {
  summary: ForecastSummary;
  historical_actuals: HistoricalMonth[];
  forecast: ForecastMonth[];
}

interface RiskStudent {
  student_id: string;
  student_name: string;
  payment_cluster: string;
  grade_level: string;
  monthly_tuition: number;
  collection_rate: number;
  risk_score: number;
  risk_level: "high" | "medium" | "low";
  reason: string;
  recent_missed: number;
  recent_late: number;
  recent_paid: number;
  expected_payment: number;
}

interface RiskSummary {
  total_students: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_billed_vnd: number;
  total_expected_vnd: number;
  expected_collection_rate: number;
}

interface RiskData {
  summary: RiskSummary;
  students: RiskStudent[];
  high_risk: RiskStudent[];
  medium_risk: RiskStudent[];
}

// ── Helpers ──────────────────────────────────────────────────
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const formatVNDShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`;
  return `${n} ₫`;
};

const CLUSTER_LABEL: Record<string, string> = {
  always_on_time: "Always On Time",
  needs_reminder: "Needs Reminder",
  erratic: "Erratic",
  high_risk: "High Risk",
  new_student: "New Student",
};

const RISK_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

// ── Custom Tooltip ───────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-amber-400 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-mono">{formatVNDShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────
export default function PaymentsPage() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tracker" | "forecast" | "risk">("tracker");

  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/ml/payment-forecast`).then((r) => r.json()),
      fetch(`${BASE}/ml/payment-risk`).then((r) => r.json()),
    ]).then(([f, r]) => {
      setForecast(f);
      setRisk(r);
      setMlLoading(false);
    });
  }, []);

  const chartData = (() => {
    if (!forecast) return [];
    const hist = forecast.historical_actuals.map((h) => ({
      label: h.month_label.replace(" 2025", "").replace(" 2026", " '26"),
      actual: h.actual_revenue,
      expected: null,
      lower: null,
      upper: null,
    }));
    const fcast = forecast.forecast.map((f) => ({
      label: f.month_label.replace(" 2026", " '26"),
      actual: null,
      expected: f.expected_revenue,
      lower: f.lower_bound,
      upper: f.upper_bound,
    }));
    return [...hist, ...fcast];
  })();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">💰</span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Payment Management</h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              Monthly tracker · Revenue forecast · Risk analysis
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
          {(["tracker", "forecast", "risk"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-amber-500 text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "tracker" ? "📋 Monthly Tracker" : tab === "forecast" ? "📈 Revenue Forecast" : "⚠️ Payment Risk"}
            </button>
          ))}
        </div>

        {/* ── MONTHLY TRACKER TAB ── */}
        {activeTab === "tracker" && <PaymentTrackerTab />}

        {/* ── FORECAST TAB ── */}
        {activeTab === "forecast" && (
          mlLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : forecast ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Expected Next Month" value={formatVNDShort(forecast.summary.expected_next_month)} sub={`avg: ${formatVNDShort(forecast.summary.avg_historical_monthly)}`} accent="amber" />
                <KPICard label="90-Day Forecast" value={formatVNDShort(forecast.summary.total_expected_90_days)} sub="March – May 2026" accent="amber" />
                <KPICard
                  label="Collection Rate"
                  value={`${(risk!.summary.expected_collection_rate * 100).toFixed(0)}%`}
                  sub={`${risk!.summary.high_risk_count} high-risk students`}
                  accent={risk!.summary.expected_collection_rate >= 0.85 ? "green" : risk!.summary.expected_collection_rate >= 0.70 ? "amber" : "red"}
                />
                <KPICard
                  label="Trend Multiplier"
                  value={`${forecast.summary.trend_multiplier > 1 ? "+" : ""}${((forecast.summary.trend_multiplier - 1) * 100).toFixed(1)}%`}
                  sub="Prophet growth signal"
                  accent={forecast.summary.trend_multiplier >= 1 ? "green" : "red"}
                />
              </div>

              {/* Chart */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Revenue Trend</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Historical actuals + 90-day forecast with confidence band</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatVNDShort(v)} width={70} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={forecast.historical_actuals.at(-1)?.month_label.replace(" 2025", "").replace(" 2026", " '26")} stroke="#475569" strokeDasharray="4 4" label={{ value: "today →", fill: "#64748b", fontSize: 10 }} />
                    <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#actualGrad)" connectNulls dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="expected" name="Forecast" stroke="#60a5fa" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" connectNulls dot={{ fill: "#60a5fa", r: 4 }} />
                    <Area type="monotone" dataKey="upper" name="Upper bound" stroke="#60a5fa" strokeWidth={0} fill="#60a5fa" fillOpacity={0.08} connectNulls dot={false} />
                    <Area type="monotone" dataKey="lower" name="Lower bound" stroke="#60a5fa" strokeWidth={0} fill="#60a5fa" fillOpacity={0.0} connectNulls dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Table */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50">
                  <h2 className="text-base font-semibold text-white">Monthly Forecast Breakdown</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3 text-left">Month</th>
                      <th className="px-6 py-3 text-right">Lower Bound</th>
                      <th className="px-6 py-3 text-right">Expected</th>
                      <th className="px-6 py-3 text-right">Upper Bound</th>
                      <th className="px-6 py-3 text-right">Confidence Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.forecast.map((m, i) => (
                      <tr key={m.month} className={`border-t border-slate-700/30 ${i === 0 ? "bg-amber-500/5" : ""}`}>
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{m.month_label}</span>
                          {i === 0 && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Next</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-400">{formatVNDShort(m.lower_bound)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-white font-semibold">{formatVNDShort(m.expected_revenue)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-400">{formatVNDShort(m.upper_bound)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-500">±{formatVNDShort(m.expected_revenue - m.lower_bound)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null
        )}

        {/* ── RISK TAB ── */}
        {activeTab === "risk" && (
          mlLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : risk ? (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">Collection Risk Overview</h2>
                  <span className="font-mono text-sm text-slate-400">
                    Expected: <span className="text-white">{formatVNDShort(risk.summary.total_expected_vnd)}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-slate-400">{formatVNDShort(risk.summary.total_billed_vnd)} billed</span>
                  </span>
                </div>
                <div className="flex rounded-full overflow-hidden h-3 mb-3">
                  <div className="bg-red-500 transition-all" style={{ width: `${(risk.summary.high_risk_count / risk.summary.total_students) * 100}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${(risk.summary.medium_risk_count / risk.summary.total_students) * 100}%` }} />
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(risk.summary.low_risk_count / risk.summary.total_students) * 100}%` }} />
                </div>
                <div className="flex gap-6 text-xs">
                  <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" />{risk.summary.high_risk_count} High Risk</span>
                  <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />{risk.summary.medium_risk_count} Medium</span>
                  <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />{risk.summary.low_risk_count} Low Risk</span>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50">
                  <h2 className="text-base font-semibold text-white">Student Payment Risk</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Sorted by risk score — based on cluster + recent 90-day payment history</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3 text-left">Student</th>
                        <th className="px-6 py-3 text-left">Cluster</th>
                        <th className="px-6 py-3 text-center">Recent (P/L/M)</th>
                        <th className="px-6 py-3 text-right">Tuition</th>
                        <th className="px-6 py-3 text-right">Expected</th>
                        <th className="px-6 py-3 text-center">Risk</th>
                        <th className="px-6 py-3 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {risk.students.map((s) => (
                        <tr key={s.student_id} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-3">
                            <span className="text-sm text-white font-medium">{s.student_name}</span>
                            <span className="block text-xs text-slate-500 font-mono">{s.grade_level}</span>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400">{CLUSTER_LABEL[s.payment_cluster] ?? s.payment_cluster}</td>
                          <td className="px-6 py-3 text-center font-mono text-xs">
                            <span className="text-emerald-400">{s.recent_paid}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-amber-400">{s.recent_late}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-red-400">{s.recent_missed}</span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-sm text-slate-300">{formatVNDShort(s.monthly_tuition)}</td>
                          <td className="px-6 py-3 text-right font-mono text-sm text-white">{formatVNDShort(s.expected_payment)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${RISK_COLORS[s.risk_level]}20`, color: RISK_COLORS[s.risk_level] }}>
                              {s.risk_level}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400 max-w-48">{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
function KPICard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "amber" | "green" | "red" }) {
  const accentClass = { amber: "text-amber-400", green: "text-emerald-400", red: "text-red-400" }[accent];
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${accentClass}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}