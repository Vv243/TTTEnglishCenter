"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teachersAPI } from "@/lib/api";
import api from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { Teacher, ClassLevel } from "@/types";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const LEVEL_OPTIONS: { value: ClassLevel; label: string; group: string }[] = [
  { value: "primary_1",  label: "Primary 1",  group: "School Reinforcement" },
  { value: "primary_2",  label: "Primary 2",  group: "School Reinforcement" },
  { value: "primary_3",  label: "Primary 3",  group: "School Reinforcement" },
  { value: "primary_4",  label: "Primary 4",  group: "School Reinforcement" },
  { value: "primary_5",  label: "Primary 5",  group: "School Reinforcement" },
  { value: "secondary_6", label: "Secondary 6", group: "School Reinforcement" },
  { value: "secondary_7", label: "Secondary 7", group: "School Reinforcement" },
  { value: "secondary_8", label: "Secondary 8", group: "School Reinforcement" },
  { value: "secondary_9", label: "Secondary 9", group: "School Reinforcement" },
  { value: "high_10", label: "High 10", group: "School Reinforcement" },
  { value: "high_11", label: "High 11", group: "School Reinforcement" },
  { value: "high_12", label: "High 12", group: "School Reinforcement" },
  { value: "starters", label: "Starters (YLE)", group: "Foreign Exam" },
  { value: "movers",   label: "Movers (YLE)",   group: "Foreign Exam" },
  { value: "flyers",   label: "Flyers (YLE)",   group: "Foreign Exam" },
  { value: "ket",      label: "KET (A2)",        group: "Foreign Exam" },
  { value: "pet",      label: "PET (B1)",        group: "Foreign Exam" },
  { value: "fce",      label: "FCE (B2)",        group: "Foreign Exam" },
  { value: "ielts",    label: "IELTS",           group: "Foreign Exam" },
  { value: "toefl",    label: "TOEFL",           group: "Foreign Exam" },
  { value: "sat",      label: "SAT",             group: "Foreign Exam" },
  { value: "general_english", label: "General English", group: "General" },
];

const LEVEL_GROUPS = ["School Reinforcement", "Foreign Exam", "General"];

function computeTotalSessions(startDate: string, endDate: string, selectedDays: number[]): number {
  if (!startDate || !endDate || selectedDays.length === 0) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (selectedDays.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function computeSessionsPerMonth(selectedDays: number[]): number {
  if (selectedDays.length === 0) return 0;
  return Math.round(selectedDays.length * 4.33);
}

const INITIAL_FORM = {
  class_name: "",
  class_code: "",
  teacher_id: "",
  level: "" as ClassLevel | "",
  days_of_week: [1] as number[],
  start_time: "08:00",
  end_time: "09:30",
  room_number: "",
  building: "",
  max_students: 15,
  tuition_per_session: 150000,
  currency: "VND",
  semester: "",
  start_date: "",
  end_date: "",
  curriculum: "",
  textbook: "",
  description: "",
  status: "scheduled" as "scheduled" | "active",
};

export default function AddClassModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const totalSessions = computeTotalSessions(form.start_date, form.end_date, form.days_of_week);
  const sessionsPerMonth = computeSessionsPerMonth(form.days_of_week);

  useEffect(() => {
    if (isOpen) {
      teachersAPI.getAll({ is_active: true }).then((res) => {
        setTeachers(res.items);
        // Auto-set teacher for non-admin users
        const user = authStorage.getUser();
        if (user?.role !== "admin" && user?.teacher_id) {
          const myTeacher = res.items.find((t: any) => t.id === user.teacher_id);
          if (myTeacher) set("teacher_id", myTeacher.id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day: number) => {
    setForm((f) => {
      const current = f.days_of_week;
      if (current.includes(day)) {
        if (current.length === 1) return f; // keep at least one
        return { ...f, days_of_week: current.filter((d) => d !== day) };
      }
      return { ...f, days_of_week: [...current, day].sort((a, b) => a - b) };
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.class_name.trim()) return setError("Class name is required.");
    if (!form.class_code.trim()) return setError("Class code is required.");
    if (!form.teacher_id) return setError("Please assign a teacher.");
    if (!form.level) return setError("Please select a level.");
    if (form.days_of_week.length === 0) return setError("Select at least one class day.");
    if (!form.start_date) return setError("Start date is required.");
    if (!form.end_date) return setError("End date is required.");
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError("End date must be after start date.");

    setLoading(true);
    try {
      // Conflict check before saving
      if (form.teacher_id && form.room_number && form.days_of_week.length > 0) {
        try {
          const conflictRes = await api.post("/classes/check-conflict/", {
            teacher_id: form.teacher_id,
            room_number: form.room_number,
            days_of_week: form.days_of_week,
            start_time: form.start_time,
            end_time: form.end_time,
            exclude_class_id: null,
          });
          const { has_conflict, conflicts, warnings } = conflictRes.data;
          if (has_conflict) {
            setLoading(false);
            setError("⚠️ Conflict: " + (conflicts as any[]).map((c) => c.message).join(" | "));
            return;
          }
          if ((warnings as any[]).length > 0) {
            const proceed = window.confirm("Warning:\n" + (warnings as any[]).map((w) => w.message).join("\n") + "\n\nContinue anyway?");
            if (!proceed) { setLoading(false); return; }
          }
        } catch (conflictErr) {
          console.warn("Conflict check failed, proceeding:", conflictErr);
        }
      }

      await api.post("/classes/", {
        ...form,
        day_of_week: form.days_of_week[0], // backward compat
        days_of_week: form.days_of_week,
        total_sessions: totalSessions,
        sessions_per_month: sessionsPerMonth,
        room_number: form.room_number || null,
        building: form.building || null,
        semester: form.semester || null,
        curriculum: form.curriculum || null,
        textbook: form.textbook || null,
        description: form.description || null,
        assistant_teacher_id: null,
      });
      onSuccess();
      onClose();
      setForm(INITIAL_FORM);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create class. Check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDayLabels = DAYS.filter((d) => form.days_of_week.includes(d.value))
    .map((d) => d.label)
    .join(" / ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Class</h2>
            <p className="text-sm text-slate-500 mt-0.5">Set up schedule, level, and tuition details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name <span className="text-red-500">*</span></label>
                <Input value={form.class_name} onChange={(e) => set("class_name", e.target.value)} placeholder="e.g. IELTS Intermediate A" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Code <span className="text-red-500">*</span></label>
                <Input value={form.class_code} onChange={(e) => set("class_code", e.target.value.toUpperCase())} placeholder="e.g. IELTS-INT-A" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher <span className="text-red-500">*</span></label>
                {isAdmin ? (
                <select
                  value={form.teacher_id}
                  onChange={(e) => set("teacher_id", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
                  {teachers.find(t => t.id === form.teacher_id)?.full_name || currentUser?.full_name || currentUser?.username || "You"}
                  <span className="ml-2 text-xs text-slate-400">(assigned to you)</span>
                </div>
              )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Level <span className="text-red-500">*</span></label>
                <select
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select a level...</option>
                  {LEVEL_GROUPS.map((group) => (
                    <optgroup key={group} label={`── ${group} ──`}>
                      {LEVEL_OPTIONS.filter((l) => l.group === group).map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">

              {/* Multi-day toggles */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class Days <span className="text-red-500">*</span>
                  {form.days_of_week.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-amber-600">{selectedDayLabels}</span>
                  )}
                </label>
                <div className="flex gap-2">
                  {DAYS.map((d) => {
                    const selected = form.days_of_week.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          selected
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Click to toggle. At least one day required.</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date <span className="text-red-500">*</span></label>
                <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Auto-computed session summary */}
          {form.start_date && form.end_date && form.days_of_week.length > 0 && totalSessions > 0 && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Computed Schedule</p>
              <div className="flex gap-6 mt-1">
                <div>
                  <p className="text-xs text-amber-600">Total Sessions</p>
                  <p className="text-lg font-bold font-mono text-amber-900">{totalSessions}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600">Sessions / Month (avg)</p>
                  <p className="text-lg font-bold font-mono text-amber-900">{sessionsPerMonth}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600">Days per Week</p>
                  <p className="text-lg font-bold font-mono text-amber-900">{form.days_of_week.length}x</p>
                </div>
              </div>
            </div>
          )}

          {/* Capacity & Tuition */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Capacity & Tuition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Students</label>
                <Input type="number" min={1} max={50} value={form.max_students} onChange={(e) => set("max_students", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tuition / Session (VND)</label>
                <Input type="number" min={0} step={10000} value={form.tuition_per_session} onChange={(e) => set("tuition_per_session", Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                <Input value={form.room_number} onChange={(e) => set("room_number", e.target.value)} placeholder="e.g. 101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                <Input value={form.building} onChange={(e) => set("building", e.target.value)} placeholder="e.g. Building A" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Brief description of the class..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
            {loading ? "Creating..." : "Create Class"}
          </Button>
        </div>
      </div>
    </div>
  );
}