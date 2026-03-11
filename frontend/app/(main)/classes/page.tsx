"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditClassModal from "@/components/ui/EditClassModal";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import AddClassModal from "@/components/ui/AddClassModal";
import { classesAPI } from "@/lib/api";
import type { Class } from "@/types";
import { ChevronLeft, ChevronRight, Clock, Calendar, Users, Search, X, Pencil, Trash2 } from "lucide-react";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const DAY_OPTIONS = [
  { value: "", label: "Any Day" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "All Levels", disabled: false },
  { value: "", label: "── School Reinforcement ──", disabled: true },
  { value: "primary_1", label: "Primary 1", disabled: false },
  { value: "primary_2", label: "Primary 2", disabled: false },
  { value: "primary_3", label: "Primary 3", disabled: false },
  { value: "primary_4", label: "Primary 4", disabled: false },
  { value: "primary_5", label: "Primary 5", disabled: false },
  { value: "secondary_6", label: "Secondary 6", disabled: false },
  { value: "secondary_7", label: "Secondary 7", disabled: false },
  { value: "secondary_8", label: "Secondary 8", disabled: false },
  { value: "secondary_9", label: "Secondary 9", disabled: false },
  { value: "high_10", label: "High 10", disabled: false },
  { value: "high_11", label: "High 11", disabled: false },
  { value: "high_12", label: "High 12", disabled: false },
  { value: "", label: "── Foreign Exam ──", disabled: true },
  { value: "starters", label: "Starters", disabled: false },
  { value: "movers", label: "Movers", disabled: false },
  { value: "flyers", label: "Flyers", disabled: false },
  { value: "ket", label: "KET (A2)", disabled: false },
  { value: "pet", label: "PET (B1)", disabled: false },
  { value: "fce", label: "FCE (B2)", disabled: false },
  { value: "ielts", label: "IELTS", disabled: false },
  { value: "toefl", label: "TOEFL", disabled: false },
  { value: "sat", label: "SAT", disabled: false },
  { value: "", label: "── General ──", disabled: true },
  { value: "general_english", label: "General English", disabled: false },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":    return "success";
    case "scheduled": return "default";
    case "completed": return "outline";
    case "cancelled": return "destructive";
    default:          return "outline";
  }
};

const formatLevel    = (level: string) => level.replace(/_/g, " ").toUpperCase();
const formatTime     = (time: string)  => time ? time.slice(0, 5) : "--:--";
const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

interface Filters {
  search: string;
  status: string;
  level: string;
  day_of_week: string;
}

const INITIAL_FILTERS: Filters = { search: "", status: "", level: "", day_of_week: "" };

export default function ClassesPage() {
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteClass, setDeleteClass] = useState<Class | null>(null);

  const perPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: perPage };
      if (filters.status)      params.status      = filters.status;
      if (filters.level)       params.level       = filters.level;
      if (filters.day_of_week) params.day_of_week = Number(filters.day_of_week);

      const result = await classesAPI.getAll(params);
      const raw: Class[] = result.classes ?? [];

      // Hide cancelled classes unless specifically filtered for
      const visible = filters.status ? raw : raw.filter((c) => c.status !== "cancelled");

      setAllClasses(visible);
      setTotal(visible.length);
      setPages(result.pages ?? 1);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters.status, filters.level, filters.day_of_week]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // Client-side search filter
  const classes = allClasses.filter((c) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return c.class_name.toLowerCase().includes(q) || c.class_code.toLowerCase().includes(q);
  });

  const hasActiveFilters = filters.search || filters.status || filters.level || filters.day_of_week;

  const clearFilters = () => { setFilters(INITIAL_FILTERS); setSearchInput(""); setPage(1); };

  const handleFilterChange = (key: keyof Omit<Filters, "search">, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteClass) return;
    await classesAPI.delete(deleteClass.id);
    fetchClasses();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Classes</h1>
          <p className="text-slate-600">
            {loading ? "Manage class schedules and enrollments" : `${total} classes total`}
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setShowAddModal(true)}
        >
          + Create Class
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by class name or code..."
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
            {STATUS_OPTIONS.map((s) => <option key={s.value + s.label} value={s.value}>{s.label}</option>)}
          </select>

          <select value={filters.level} onChange={(e) => handleFilterChange("level", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700">
            {LEVEL_OPTIONS.map((l) => <option key={l.value + l.label} value={l.value} disabled={l.disabled}>{l.label}</option>)}
          </select>

          <select value={filters.day_of_week} onChange={(e) => handleFilterChange("day_of_week", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700">
            {DAY_OPTIONS.map((d) => <option key={d.value + d.label} value={d.value}>{d.label}</option>)}
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
            {filters.search && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Search: &quot;{filters.search}&quot;</span>}
            {filters.status && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Status: {filters.status}</span>}
            {filters.level && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Level: {formatLevel(filters.level)}</span>}
            {filters.day_of_week && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Day: {DAYS_OF_WEEK[Number(filters.day_of_week)]}</span>}
          </div>
        )}
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse text-slate-500">Loading classes...</div>
        </div>
      ) : classes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-48 text-slate-400">
          <Search className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No classes match your filters</p>
          {hasActiveFilters && <button onClick={clearFilters} className="mt-2 text-xs text-amber-600 hover:underline">Clear filters</button>}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classes.map((classItem, index) => (
            <Card
              key={classItem.id}
              className="p-6 hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{classItem.class_name}</h3>
                  <p className="text-sm font-mono text-slate-500">{classItem.class_code}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={getStatusColor(classItem.status) as any}>{classItem.status.toUpperCase()}</Badge>
                  <button
                    onClick={() => setEditClass(classItem)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Edit class"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteClass(classItem)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Cancel class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="px-3 py-1 text-sm font-medium bg-amber-50 text-amber-700 rounded-full">
                  {formatLevel(classItem.level)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {(classItem.days_of_week?.length > 0
                      ? classItem.days_of_week.map((d: number) => DAYS_OF_WEEK[d]).join(" / ")
                      : DAYS_OF_WEEK[classItem.day_of_week]) ?? "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{formatTime(classItem.start_time)} – {formatTime(classItem.end_time)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>
                    <span className="font-semibold text-slate-900">{classItem.current_enrollment}</span>
                    {" / "}{classItem.max_students} students
                  </span>
                </div>
              </div>

              {/* Enrollment bar */}
              <div className="mb-4">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                    style={{ width: `${Math.min((classItem.current_enrollment / classItem.max_students) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{classItem.max_students - classItem.current_enrollment} spots remaining</p>
                <p className="text-xs text-slate-400 mt-1">
                  {classItem.start_date
                    ? new Date(classItem.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                  {" → "}
                  {classItem.end_date
                    ? new Date(classItem.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Tuition per session</p>
                  <p className="text-lg font-bold font-mono text-slate-900">
                    {formatCurrency(classItem.tuition_per_session)}{" "}
                    <span className="text-sm font-normal text-slate-500">{classItem.currency}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} classes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm font-mono text-slate-600">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <AddClassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchClasses}
      />

      <EditClassModal
        classItem={editClass}
        isOpen={!!editClass}
        onClose={() => setEditClass(null)}
        onSuccess={fetchClasses}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteClass}
        onClose={() => setDeleteClass(null)}
        onConfirm={handleDelete}
        title={`Cancel "${deleteClass?.class_name ?? "class"}"?`}
        description={`This will mark ${deleteClass?.class_name ?? "this class"} as cancelled. Enrollments and payment history are preserved.`}
        confirmLabel="Cancel Class"
      />
    </div>
  );
}