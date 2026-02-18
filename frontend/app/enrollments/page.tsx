"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enrollmentsAPI } from "@/lib/api";
import type { Enrollment, PaginatedResponse } from "@/types";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
  { value: "suspended", label: "Suspended" },
  { value: "waitlisted", label: "Waitlisted" },
];

const TREND_OPTIONS = [
  { value: "", label: "Any Trend" },
  { value: "improving", label: "Improving" },
  { value: "stable", label: "Stable" },
  { value: "declining", label: "Declining" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":     return "success";
    case "completed":  return "default";
    case "dropped":    return "destructive";
    case "suspended":  return "warning";
    case "waitlisted": return "outline";
    default:           return "outline";
  }
};

const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

const TrendIcon = ({ trend }: { trend: string | null }) => {
  if (trend === "improving") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (trend === "declining") return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
};

interface Filters {
  search: string;
  status: string;
  progress_trend: string;
}

const INITIAL_FILTERS: Filters = { search: "", status: "", progress_trend: "" };

export default function EnrollmentsPage() {
  const [data, setData] = useState<PaginatedResponse<Enrollment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const perPage = 10;

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

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const enrollments = (data?.items || []).filter((e) => {
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

  const hasActiveFilters = filters.search || filters.status || filters.progress_trend;
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setSearchInput(""); setPage(1); };
  const handleFilterChange = (key: keyof Omit<Filters, "search">, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Enrollments</h1>
          <p className="text-slate-600">
            {data ? `${data.total} enrollments total` : "Track student progress and class assignments"}
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">+ New Enrollment</Button>
      </div>

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
                  <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors animate-fade-in cursor-pointer"
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
                      {(enrollment.absences > 0 || enrollment.tardies > 0) && (
                        <p className="text-xs text-slate-500 mt-1">{enrollment.absences} absent · {enrollment.tardies} late</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {enrollment.average_score !== null ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold font-mono text-slate-900">{enrollment.average_score.toFixed(1)}</span>
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
    </div>
  );
}