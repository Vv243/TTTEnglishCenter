"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classesAPI } from "@/lib/api";
import api from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { Class } from "@/types";
import ScheduleGrid, { GridClass } from "@/components/ui/ScheduleGrid";
import EditClassModal from "@/components/ui/EditClassModal";
import AddClassModal from "@/components/ui/AddClassModal";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Search, X, LayoutGrid, Calendar, ChevronDown, ChevronUp,
  Users, Clock, BookOpen, AlertTriangle, CheckCircle
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEVEL_COLORS: Record<string, string> = {
  ielts: "bg-blue-100 text-blue-700",
  toefl: "bg-purple-100 text-purple-700",
  sat: "bg-red-100 text-red-700",
  fce: "bg-green-100 text-green-700",
  general_english: "bg-amber-100 text-amber-700",
  default: "bg-slate-100 text-slate-700",
};

const getLevelColor = (level: string) =>
  LEVEL_COLORS[level] || LEVEL_COLORS.default;

const formatDays = (days: number[]) =>
  days.map(d => DAY_NAMES[d]).join(", ");

const formatTime = (t: string) => t.slice(0, 5);

// ── Cancel Class Confirmation ─────────────────────────────────
function CancelClassDialog({
  cls,
  onClose,
  onConfirm,
}: {
  cls: Class;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);

  useEffect(() => {
    api.get("/enrollments/", { params: { class_id: cls.id, status: "enrolled", page_size: 1 } })
      .then(r => setEnrolledCount(r.data.total || 0))
      .catch(() => setEnrolledCount(0));
  }, [cls.id]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await api.patch(`/classes/${cls.id}/`, { status: "cancelled" });
      onConfirm();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to cancel class.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cancel {cls.class_name}?</h3>
            <p className="text-sm text-slate-500 mt-1">
              This will mark the class as cancelled.
              {enrolledCount !== null && enrolledCount > 0 && (
                <span className="text-red-600 font-medium"> {enrolledCount} enrolled student{enrolledCount > 1 ? "s" : ""} will be withdrawn automatically.</span>
              )}
            </p>
          </div>
        </div>
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Cancelled classes can be reactivated by an admin. All history is preserved.
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Keep Class</Button>
          <Button onClick={handleConfirm} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <AlertTriangle className="h-4 w-4" />
            {saving ? "Cancelling..." : "Cancel Class"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Class Card (Card View) ────────────────────────────────────
function ClassCard({
  cls,
  isAdmin,
  isOwnClass,
  onEdit,
  onCancel,
  onDelete,
}: {
  cls: Class;
  isAdmin: boolean;
  isOwnClass: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = cls.days_of_week?.length > 0 ? formatDays(cls.days_of_week) : DAY_NAMES[cls.day_of_week] || "—";
  const fillPct = Math.round((cls.current_enrollment / cls.max_students) * 100);
  const isFull = cls.current_enrollment >= cls.max_students;
  const canEdit = isAdmin || isOwnClass;
  const canCancel = isAdmin || isOwnClass;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${cls.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-lg truncate">{cls.class_name}</h3>
              <Badge variant={cls.status === "active" ? "success" : cls.status === "scheduled" ? "warning" : "destructive"}>
                {cls.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{cls.class_code}</p>
          </div>
          {canEdit && cls.status !== "cancelled" && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                ✏️
              </button>
              {canCancel && (
                <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancel class">
                  ❌
                </button>
              )}
              {isAdmin && (
                <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete permanently">
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Level badge */}
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase mb-3 ${getLevelColor(cls.level)}`}>
          {cls.level.replace(/_/g, " ")}
        </span>

        {/* Schedule */}
        <div className="space-y-1.5 text-sm text-slate-600 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{days}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatTime(cls.start_time)} – {formatTime(cls.end_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className={isFull ? "text-red-600 font-medium" : ""}>{cls.current_enrollment} / {cls.max_students} students</span>
            {isFull && <span className="text-xs text-red-500 font-medium">FULL</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${fillPct >= 100 ? "bg-red-500" : fillPct >= 75 ? "bg-amber-500" : "bg-green-400"}`}
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{cls.max_students - cls.current_enrollment} spots remaining</span>
          {cls.room_number && <span>📍 {cls.room_number}</span>}
        </div>

        {/* Dates */}
        {(cls.start_date || cls.end_date) && (
          <p className="text-xs text-slate-400 mt-2">
            {cls.start_date && new Date(cls.start_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
            {cls.start_date && cls.end_date && " → "}
            {cls.end_date && new Date(cls.end_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}

        {/* Tuition */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Tuition per session</p>
            <p className="font-bold font-mono text-slate-900">
              {new Intl.NumberFormat("vi-VN").format(cls.tuition_per_session)} <span className="text-xs font-normal text-slate-400">VND</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ClassesPage() {
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [gridClasses, setGridClasses] = useState<GridClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"card" | "grid">("card");
  const [showCancelled, setShowCancelled] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | undefined>();
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [cancelClass, setCancelClass] = useState<Class | null>(null);
  const [deleteClass, setDeleteClass] = useState<Class | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefilledSlot, setPrefilledSlot] = useState<{ day: number; time: string } | null>(null);

  useEffect(() => {
    const user = authStorage.getUser();
    setIsAdmin(user?.role === "admin");
    if (user?.role !== "admin") {
      // Get teacher_id for current user
      api.get("/auth/me").then(r => {
        setCurrentTeacherId(r.data.teacher_id);
      }).catch(() => {});
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsResult, gridResult] = await Promise.all([
        classesAPI.getAll({ per_page: 100 } as any),
        api.get("/classes/schedule-grid/").then(r => r.data),
      ]);
      setAllClasses(cardsResult.items);
      setGridClasses(gridResult);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleDeleteClass = async () => {
    if (!deleteClass) return;
    await api.delete(`/classes/${deleteClass.id}/`);
    fetchClasses();
  };

  const isOwnClass = (cls: Class) => {
    if (isAdmin) return true;
    return currentTeacherId && cls.teacher_id === currentTeacherId;
  };

  // Filter classes for card view
  const filtered = allClasses.filter(cls => {
    if (!showCancelled && cls.status === "cancelled") return false;
    if (statusFilter && cls.status !== statusFilter) return false;
    if (levelFilter && cls.level !== levelFilter) return false;
    if (dayFilter) {
      const days = cls.days_of_week || [cls.day_of_week];
      if (!days.includes(parseInt(dayFilter))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!cls.class_name.toLowerCase().includes(q) && !cls.class_code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSlotClick = (day: number, time: string) => {
    // Convert grid day (0=Mon) to stored day (1=Mon, 0=Sun)
    const storedDay = day === 6 ? 0 : day + 1;
    setPrefilledSlot({ day: storedDay, time });
    setShowAddModal(true);
  };

  const handleGridClassClick = (cls: GridClass) => {
    const fullClass = allClasses.find(c => c.id === cls.class_id);
    if (fullClass && (isAdmin || cls.is_own)) {
      setEditClass(fullClass);
    }
  };

  const levels = [...new Set(allClasses.map(c => c.level))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Classes</h1>
          <p className="text-slate-600">{allClasses.filter(c => c.status !== "cancelled").length} classes total</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("card")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === "card" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === "grid" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Calendar className="h-4 w-4" /> Schedule
            </button>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setPrefilledSlot(null); setShowAddModal(true); }}>
            + Create Class
          </Button>
        </div>
      </div>

      {/* ── SCHEDULE GRID VIEW ── */}
      {view === "grid" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span>Click any <span className="text-green-600 font-medium">empty slot</span> to create a class at that time · Click a <span className="text-amber-600 font-medium">class block</span> to edit it</span>
            </div>
            {loading ? (
              <div className="text-center py-12 text-slate-400 animate-pulse">Loading schedule...</div>
            ) : (
              <ScheduleGrid
                classes={gridClasses}
                currentTeacherId={currentTeacherId}
                isAdmin={isAdmin}
                onClassClick={handleGridClassClick}
                onSlotClick={handleSlotClick}
              />
            )}
          </Card>
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {view === "card" && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by class name or code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">All Levels</option>
                {levels.map(l => <option key={l} value={l}>{l.replace(/_/g, " ").toUpperCase()}</option>)}
              </select>

              <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">Any Day</option>
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>

              <button
                onClick={() => setShowCancelled(v => !v)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${showCancelled ? "bg-slate-700 text-white border-slate-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {showCancelled ? "Hide Cancelled" : "Show Cancelled"}
              </button>

              {(search || statusFilter || levelFilter || dayFilter) && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter(""); setLevelFilter(""); setDayFilter(""); }} className="gap-1">
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Class cards grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 animate-pulse">Loading classes...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No classes match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(cls => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isAdmin={isAdmin}
                  isOwnClass={!!isOwnClass(cls)}
                  onEdit={() => setEditClass(cls)}
                  onCancel={() => setCancelClass(cls)}
                  onDelete={() => setDeleteClass(cls)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <AddClassModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setPrefilledSlot(null); }}
          onSuccess={fetchClasses}
        />
      )}

      {editClass && (
        <EditClassModal
          isOpen={!!editClass}
          classItem={editClass}
          onClose={() => setEditClass(null)}
          onSuccess={fetchClasses}
        />
      )}

      {cancelClass && (
        <CancelClassDialog
          cls={cancelClass}
          onClose={() => setCancelClass(null)}
          onConfirm={() => { setCancelClass(null); fetchClasses(); }}
        />
      )}

      {deleteClass && (
        <DeleteConfirmDialog
          isOpen={!!deleteClass}
          onClose={() => setDeleteClass(null)}
          onConfirm={handleDeleteClass}
          title={`Delete ${deleteClass?.class_name}?`}
          description="This will permanently delete the class and all its enrollments. This cannot be undone."
          confirmLabel="Delete Class"
        />
      )}
    </div>
  );
}