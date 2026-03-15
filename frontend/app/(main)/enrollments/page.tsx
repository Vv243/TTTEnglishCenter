"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddEnrollmentModal from "@/components/ui/AddEnrollmentModal";
import { enrollmentsAPI, classesAPI } from "@/lib/api";
import api from "@/lib/api";
import type { Enrollment, Class, PaginatedResponse } from "@/types";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  Search, X, ChevronDown, ChevronUp, Users, Clock, CheckCircle,
  AlertCircle, List, LayoutList
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "enrolled", label: "Enrolled" },
  { value: "pending", label: "Pending Payment" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "withdrawn", label: "Withdrawn" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "enrolled":   return "success";
    case "pending":    return "warning";
    case "waitlisted": return "outline";
    case "withdrawn":  return "destructive";
    default:           return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "enrolled":   return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "pending":    return <Clock className="h-3 w-3 text-amber-500" />;
    case "waitlisted": return <AlertCircle className="h-3 w-3 text-slate-400" />;
    case "withdrawn":  return <X className="h-3 w-3 text-red-400" />;
    default:           return null;
  }
};

const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

const TrendIcon = ({ trend }: { trend: string | null }) => {
  if (trend === "improving") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (trend === "declining") return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
};

// ── By Class Row ──────────────────────────────────────────────
interface ClassRosterCardProps {
  cls: Class;
  onRefresh: () => void;
}

function ClassRosterCard({ cls, onRefresh }: ClassRosterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await enrollmentsAPI.getAll({ class_id: cls.id, page_size: 100 } as any);
      setEnrollments(result.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cls.id]);

  useEffect(() => {
    if (expanded) fetchEnrollments();
  }, [expanded, fetchEnrollments]);

  const handlePromote = async (enrollmentId: string) => {
    await enrollmentsAPI.update(enrollmentId, { status: "pending" });
    fetchEnrollments();
    onRefresh();
  };

  const handleWithdraw = async (enrollmentId: string) => {
    if (!confirm("Withdraw this student from the class?")) return;
    await api.delete(`/enrollments/${enrollmentId}/`);
    fetchEnrollments();
    onRefresh();
  };

  const handleSaveNote = async (enrollmentId: string) => {
    setSaving(true);
    try {
      await enrollmentsAPI.update(enrollmentId, { drop_reason: noteText } as any);
      setEditingNote(null);
      fetchEnrollments();
    } finally {
      setSaving(false);
    }
  };

  const enrolled = enrollments.filter(e => e.status === "enrolled").length;
  const pending  = enrollments.filter(e => e.status === "pending").length;
  const waitlist = enrollments.filter(e => e.status === "waitlisted").length;

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = cls.days_of_week?.map(d => DAY_NAMES[d]).join(", ") || DAY_NAMES[cls.day_of_week] || "—";

  return (
    <Card className="overflow-hidden">
      {/* Class header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{cls.class_name}</span>
              <span className="text-xs font-mono text-slate-400">{cls.class_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                {cls.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>{days} · {cls.start_time}–{cls.end_time}</span>
              {cls.room_number && <span>📍 {cls.room_number}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Counts */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" /> {expanded ? enrolled : cls.current_enrollment} enrolled
            </span>
            {(expanded ? pending : 0) > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" /> {pending} pending
              </span>
            )}
            {(expanded ? waitlist : 0) > 0 && (
              <span className="flex items-center gap-1 text-slate-500">
                <AlertCircle className="h-3 w-3" /> {waitlist} waitlisted
              </span>
            )}
            <span className="text-slate-400">{cls.current_enrollment}/{cls.max_students} spots</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Roster */}
      {expanded && (
        <div className="border-t border-slate-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm animate-pulse">Loading roster...</div>
          ) : enrollments.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">No students enrolled yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuition</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollments.map(e => (
                  <tr key={e.id} className={`${e.status === "withdrawn" ? "opacity-40" : ""}`}>
                    {/* Student */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {e.student?.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{e.student?.full_name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-400 capitalize">{e.student?.grade_level?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(e.status)}
                        <Badge variant={getStatusColor(e.status)}>{e.status.toUpperCase()}</Badge>
                        {e.status === "waitlisted" && e.waitlist_position && (
                          <span className="text-xs text-slate-400">#{e.waitlist_position}</span>
                        )}
                      </div>
                    </td>

                    {/* Tuition */}
                    <td className="px-6 py-3">
                      <p className="text-sm font-mono font-semibold text-slate-900">
                        {formatCurrency(e.agreed_tuition_per_session)}
                      </p>
                      {e.discount_percent > 0 && (
                        <p className="text-xs text-green-600">-{e.discount_percent}%</p>
                      )}
                    </td>

                    {/* Attendance */}
                    <td className="px-6 py-3">
                      {e.attendance_rate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-slate-900">
                            {Math.round(e.attendance_rate)}%
                          </span>
                          <TrendIcon trend={e.progress_trend} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="px-6 py-3 max-w-[180px]">
                      {editingNote === e.id ? (
                        <div className="flex gap-1">
                          <input
                            value={noteText}
                            onChange={ev => setNoteText(ev.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder="Add note..."
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNote(e.id)}
                            disabled={saving}
                            className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
                          >
                            {saving ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-xs px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNote(e.id); setNoteText((e as any).drop_reason ?? ""); }}
                          className="text-xs text-slate-400 hover:text-amber-600 text-left truncate max-w-full"
                        >
                          {(e as any).drop_reason || <span className="italic">Add note...</span>}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {e.status === "waitlisted" && (
                          <button
                            onClick={() => handlePromote(e.id)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium"
                          >
                            Promote
                          </button>
                        )}
                        {e.status !== "withdrawn" && (
                          <button
                            onClick={() => handleWithdraw(e.id)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────
interface Filters {
  search: string;
  status: string;
  progress_trend: string;
}

const INITIAL_FILTERS: Filters = { search: "", status: "", progress_trend: "" };

const TREND_OPTIONS = [
  { value: "", label: "Any Trend" },
  { value: "improving", label: "Improving" },
  { value: "stable", label: "Stable" },
  { value: "declining", label: "Declining" },
];

export default function EnrollmentsPage() {
  const [view, setView] = useState<"list" | "class">("list");
  const [data, setData] = useState<PaginatedResponse<Enrollment> | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const perPage = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: perPage };
      if (filters.status) params.status = filters.status;
      const result = await enrollmentsAPI.getAll(params);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters.status]);

  const fetchClasses = useCallback(async () => {
    try {
      const result = await classesAPI.getAll({ per_page: 100 } as any);
      setClasses(result.items.filter((c: Class) => c.status !== "cancelled"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const enrollments = (data?.items || []).filter((e) => {
    // Hide withdrawn by default unless explicitly filtered
    if (!filters.status && e.status === "withdrawn") return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesStudent = e.student?.full_name?.toLowerCase().includes(q);
      const matchesClass   = e.class?.class_name?.toLowerCase().includes(q) ||
                             e.class?.class_code?.toLowerCase().includes(q);
      if (!matchesStudent && !matchesClass) return false;
    }
    if (filters.progress_trend && e.progress_trend !== filters.progress_trend) return false;
    return true;
  });

  const filteredClasses = classes.filter(c =>
    !classSearch ||
    c.class_name.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.class_code.toLowerCase().includes(classSearch.toLowerCase())
  );

  const hasActiveFilters = filters.search || filters.status || filters.progress_trend;
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setSearchInput(""); setPage(1); };
  const handleFilterChange = (key: keyof Omit<Filters, "search">, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Enrollments</h1>
          <p className="text-slate-600">
            {data ? `${data.total} enrollments total` : "Track student progress and class assignments"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setView("class")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === "class" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutList className="h-4 w-4" /> By Class
            </button>
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setShowAddModal(true)}
          >
            + New Enrollment
          </Button>
        </div>
      </div>

      {/* ── BY CLASS VIEW ── */}
      {view === "class" && (
        <div className="space-y-4">
          {/* Class search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
          </Card>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No classes found</div>
          ) : (
            filteredClasses.map(cls => (
              <ClassRosterCard key={cls.id} cls={cls} onRefresh={fetchEnrollments} />
            ))
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student or class name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <select value={filters.progress_trend} onChange={(e) => handleFilterChange("progress_trend", e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700">
                {TREND_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">Filters:</span>
                {filters.search && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Search: "{filters.search}"</span>}
                {filters.status && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Status: {filters.status}</span>}
                {filters.progress_trend && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Trend: {filters.progress_trend}</span>}
              </div>
            )}
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-pulse text-slate-500">Loading enrollments...</div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No enrollments match your filters</p>
                {hasActiveFilters && <button onClick={clearFilters} className="mt-2 text-xs text-amber-600 hover:underline">Clear filters</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuition</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enrollment, index) => (
                      <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {enrollment.student?.full_name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{enrollment.student?.full_name || "Unknown"}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(enrollment.enrollment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{enrollment.class?.class_name || "Unknown"}</p>
                          <p className="text-xs font-mono text-slate-500">{enrollment.class?.class_code || "-"}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-lg font-bold font-mono text-slate-900">
                            {enrollment.attendance_rate ? `${Math.round(enrollment.attendance_rate)}%` : "—"}
                          </span>
                          {enrollment.attendance_rate && (
                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${enrollment.attendance_rate >= 80 ? "bg-green-400" : enrollment.attendance_rate >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                                style={{ width: `${enrollment.attendance_rate}%` }}
                              />
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {enrollment.average_score !== null ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold font-mono text-slate-900">{Number(enrollment.average_score).toFixed(1)}</span>
                                <span className="text-xs text-slate-500">avg</span>
                              </div>
                              {enrollment.progress_trend && (
                                <div className="flex items-center gap-1 mt-1">
                                  <TrendIcon trend={enrollment.progress_trend} />
                                  <span className="text-xs capitalize text-slate-600">{enrollment.progress_trend}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">No data</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-mono font-semibold text-slate-900">{formatCurrency(enrollment.agreed_tuition_per_session)}</p>
                          {enrollment.discount_percent > 0 && (
                            <p className="text-xs text-green-600">-{enrollment.discount_percent}% discount</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(enrollment.status)}>{enrollment.status.toUpperCase()}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data && data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                <p className="text-sm text-slate-600">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, data.total)} of {data.total} enrollments
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm font-mono text-slate-600">Page {page} of {data.pages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <AddEnrollmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchEnrollments}
      />
    </div>
  );
}