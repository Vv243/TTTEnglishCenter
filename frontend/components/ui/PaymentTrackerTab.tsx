"use client";

import { useEffect, useState, useCallback } from "react";
import RecordPaymentModal from "./RecordPaymentModal";
import PaymentReceipt from "./PaymentReceipt";
import StudentPaymentHistory from "./StudentPaymentHistory";

// ── Types ─────────────────────────────────────────────────────
interface StudentPaymentStatus {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  agreed_tuition: number;
  discount_percent: number;
  monthly_amount: number;
  status: string;
  paid_date: string | null;
  due_date: string | null;
  payment_method: string | null;
  note: string | null;
  payment_history_id: string | null;
}

interface ClassTrackerCard {
  class_id: string;
  class_name: string;
  level: string;
  teacher_name: string;
  start_date: string | null;
  end_date: string | null;
  class_status: string;
  total_enrolled: number;
  paid_count: number;
  due_count: number;
  overdue_count: number;
  total_collected: number;
  total_expected: number;
  students: StudentPaymentStatus[];
}

interface TrackerData {
  month_year: string;
  month_label: string;
  classes: ClassTrackerCard[];
  summary: {
    total_collected: number;
    total_expected: number;
    paid_count: number;
    due_count: number;
    overdue_count: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

const formatVNDShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`;
  return `${n} ₫`;
};

function prevMonth(my: string): string {
  const [y, m] = my.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(my: string): string {
  const [y, m] = my.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  paid: { label: "Paid", color: "text-emerald-400", dot: "bg-emerald-500" },
  late: { label: "Postponed", color: "text-amber-400", dot: "bg-amber-400" },
  missed: { label: "Missed", color: "text-red-400", dot: "bg-red-500" },
  due: { label: "Due", color: "text-slate-300", dot: "bg-slate-400" },
  overdue: { label: "Overdue", color: "text-red-400", dot: "bg-red-500" },
  not_started: {
    label: "Not started",
    color: "text-slate-500",
    dot: "bg-slate-600",
  },
};

// ── Main Component ────────────────────────────────────────────
export default function PaymentTrackerTab() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [monthYear, setMonthYear] = useState(defaultMonth);
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");

  // Modal states
  const [recordModal, setRecordModal] = useState<{
    open: boolean;
    student: StudentPaymentStatus | null;
    className: string;
  }>({ open: false, student: null, className: "" });

  const [receipt, setReceipt] = useState<{
    open: boolean;
    data: null | {
      student_name: string;
      class_name: string;
      month_label: string;
      amount: number;
      payment_method: string;
      paid_date: string;
      recorded_by: string;
    };
  }>({ open: false, data: null });

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
  }>({ open: false, studentId: "", studentName: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("ttt_token="))
      ?.split("=")[1];
    try {
      const res = await fetch(
        `${BASE}/payments/monthly-tracker/?month_year=${monthYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monthYear]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleClass(classId: string) {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      next.has(classId) ? next.delete(classId) : next.add(classId);
      return next;
    });
  }

  function openRecordModal(student: StudentPaymentStatus, className: string) {
    setRecordModal({ open: true, student, className });
  }

  function handleRecordSuccess() {
    load();
    // If it was a paid action, show receipt
    // Receipt will be triggered by re-render after load
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary;
  const collectionPct =
    s.total_expected > 0
      ? Math.round((s.total_collected / s.total_expected) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Month Navigator ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthYear(prevMonth(monthYear))}
            className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <h2 className="text-xl font-bold text-white min-w-40 text-center">
            {data.month_label}
          </h2>
          <button
            onClick={() => setMonthYear(nextMonth(monthYear))}
            className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </div>

        {monthYear !== defaultMonth && (
          <button
            onClick={() => setMonthYear(defaultMonth)}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Back to current month
          </button>
        )}
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Collected
          </p>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {formatVNDShort(s.total_collected)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            of {formatVNDShort(s.total_expected)} expected
          </p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Collection Rate
          </p>
          <p
            className={`text-xl font-bold font-mono ${collectionPct >= 80 ? "text-emerald-400" : collectionPct >= 60 ? "text-amber-400" : "text-red-400"}`}
          >
            {collectionPct}%
          </p>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full transition-all ${collectionPct >= 80 ? "bg-emerald-500" : collectionPct >= 60 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${Math.min(collectionPct, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Paid
          </p>
          <p className="text-xl font-bold text-white font-mono">
            {s.paid_count}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">students</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Overdue / Due
          </p>
          <p className="text-xl font-bold font-mono">
            <span className="text-red-400">{s.overdue_count}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-amber-400">{s.due_count}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">need action</p>
        </div>
      </div>

      {/* ── Class Cards ── */}
      <div className="space-y-3">
        {/* ── Search ── */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes or teachers..."
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
        {data.classes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No active classes found.
          </div>
        )}

        {data.classes
          .filter((cls) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
              cls.class_name.toLowerCase().includes(q) ||
              cls.teacher_name.toLowerCase().includes(q) ||
              cls.level.toLowerCase().includes(q)
            );
          })
          .map((cls) => {
            const isExpanded = expandedClasses.has(cls.class_id);
            const collPct =
              cls.total_expected > 0
                ? Math.round((cls.total_collected / cls.total_expected) * 100)
                : 0;

            return (
              <div
                key={cls.class_id}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden"
              >
                {/* Class header — clickable to expand */}
                <button
                  onClick={() => toggleClass(cls.class_id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-700/20 transition-colors text-left"
                >
                  {/* Expand icon */}
                  <span
                    className={`text-slate-400 transition-transform text-sm ${isExpanded ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>

                  {/* Class info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">
                        {cls.class_name}
                      </span>
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                        {cls.level}
                      </span>
                      <span className="text-xs text-slate-500">
                        {cls.teacher_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{cls.total_enrolled} students</span>
                      {cls.start_date && (
                        <span>
                          Started{" "}
                          {new Date(cls.start_date).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Collected</p>
                      <p className="text-sm font-mono text-emerald-400">
                        {formatVNDShort(cls.total_collected)}
                      </p>
                    </div>

                    {/* Mini progress pills */}
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        ✓ {cls.paid_count}
                      </span>
                      {cls.due_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                          ⏳ {cls.due_count}
                        </span>
                      )}
                      {cls.overdue_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                          ⚠ {cls.overdue_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded: student list */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50">
                    {/* Progress bar */}
                    <div className="px-6 py-3 bg-slate-800/60 flex items-center gap-3">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(collPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono shrink-0">
                        {formatVNDShort(cls.total_collected)} /{" "}
                        {formatVNDShort(cls.total_expected)} ({collPct}%)
                      </span>
                    </div>

                    {/* Student rows */}
                    {cls.students.map((st) => {
                      const cfg =
                        STATUS_CONFIG[st.status] || STATUS_CONFIG["due"];
                      const isPaid = st.status === "paid";

                      return (
                        <div
                          key={st.student_id}
                          className="flex items-center gap-4 px-6 py-3 border-t border-slate-700/30 hover:bg-slate-700/10 transition-colors"
                        >
                          {/* Status dot */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                          />

                          {/* Student name */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() =>
                                setHistoryModal({
                                  open: true,
                                  studentId: st.student_id,
                                  studentName: st.student_name,
                                })
                              }
                              className="text-sm text-white hover:text-amber-400 transition-colors font-medium truncate block text-left"
                            >
                              {st.student_name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {st.payment_method && (
                                <span className="text-xs text-slate-500">
                                  ·{" "}
                                  {st.payment_method === "cash"
                                    ? "Tiền mặt"
                                    : "Chuyển khoản"}
                                </span>
                              )}
                              {st.note && (
                                <span className="text-xs text-slate-500 truncate max-w-32">
                                  · {st.note}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <span className="font-mono text-sm text-slate-300 shrink-0 hidden sm:block">
                            {formatVNDShort(st.monthly_amount)}
                          </span>

                          {/* Action button */}
                          <div className="flex gap-2 shrink-0">
                            {isPaid ? (
                              <button
                                onClick={() =>
                                  setReceipt({
                                    open: true,
                                    data: {
                                      student_name: st.student_name,
                                      class_name: cls.class_name,
                                      month_label: data.month_label,
                                      amount: st.monthly_amount,
                                      payment_method:
                                        st.payment_method || "cash",
                                      paid_date: st.paid_date
                                        ? new Date(
                                            st.paid_date,
                                          ).toLocaleDateString("vi-VN")
                                        : new Date().toLocaleDateString(
                                            "vi-VN",
                                          ),
                                      recorded_by: "TTT Admin",
                                    },
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                              >
                                🖨 Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openRecordModal(st, cls.class_name)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  st.status === "overdue" ||
                                  st.status === "missed"
                                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                                }`}
                              >
                                Record
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ── Record Payment Modal ── */}
      {recordModal.open && recordModal.student && (
        <RecordPaymentModal
          isOpen={recordModal.open}
          onClose={() =>
            setRecordModal({ open: false, student: null, className: "" })
          }
          onSuccess={handleRecordSuccess}
          student={{
            student_id: recordModal.student.student_id,
            student_name: recordModal.student.student_name,
            enrollment_id: recordModal.student.enrollment_id,
            monthly_amount: recordModal.student.monthly_amount,
          }}
          monthYear={monthYear}
          monthLabel={data.month_label}
          currentStatus={recordModal.student.status}
        />
      )}

      {/* ── Receipt Modal ── */}
      {receipt.open && receipt.data && (
        <PaymentReceipt
          isOpen={receipt.open}
          onClose={() => setReceipt({ open: false, data: null })}
          data={receipt.data}
        />
      )}

      {/* ── Student History Modal ── */}
      <StudentPaymentHistory
        isOpen={historyModal.open}
        onClose={() =>
          setHistoryModal({ open: false, studentId: "", studentName: "" })
        }
        studentId={historyModal.studentId}
        studentName={historyModal.studentName}
      />
    </div>
  );
}
