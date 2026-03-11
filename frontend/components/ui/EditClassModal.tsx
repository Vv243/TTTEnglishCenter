"use client";

import { useEffect, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classesAPI, teachersAPI } from "@/lib/api";
import type { Class, Teacher } from "@/types";

const CLASS_LEVELS = [
  { value: "starters",        label: "Starters",        group: "Cambridge Young Learners" },
  { value: "movers",          label: "Movers",          group: "Cambridge Young Learners" },
  { value: "flyers",          label: "Flyers",          group: "Cambridge Young Learners" },
  { value: "ket",             label: "KET (A2 Key)",    group: "Cambridge Main Suite" },
  { value: "pet",             label: "PET (B1)",        group: "Cambridge Main Suite" },
  { value: "fce",             label: "FCE (B2)",        group: "Cambridge Main Suite" },
  { value: "ielts",           label: "IELTS",           group: "International Exams" },
  { value: "toefl",           label: "TOEFL",           group: "International Exams" },
  { value: "sat",             label: "SAT",             group: "International Exams" },
  { value: "primary_1",       label: "Primary 1",       group: "School Level" },
  { value: "primary_2",       label: "Primary 2",       group: "School Level" },
  { value: "primary_3",       label: "Primary 3",       group: "School Level" },
  { value: "primary_4",       label: "Primary 4",       group: "School Level" },
  { value: "primary_5",       label: "Primary 5",       group: "School Level" },
  { value: "secondary_6",     label: "Secondary 6",     group: "School Level" },
  { value: "secondary_7",     label: "Secondary 7",     group: "School Level" },
  { value: "secondary_8",     label: "Secondary 8",     group: "School Level" },
  { value: "secondary_9",     label: "Secondary 9",     group: "School Level" },
  { value: "high_10",         label: "High 10",         group: "School Level" },
  { value: "high_11",         label: "High 11",         group: "School Level" },
  { value: "high_12",         label: "High 12",         group: "School Level" },
  { value: "general_english", label: "General English", group: "General" },
];

const CLASS_STATUSES = [
  { value: "scheduled",  label: "Scheduled" },
  { value: "active",     label: "Active" },
  { value: "completed",  label: "Completed" },
  { value: "cancelled",  label: "Cancelled" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface EditClassForm {
  class_name: string;
  class_code: string;
  level: string;
  status: string;
  teacher_id: string;
  assistant_teacher_id: string;
  start_time: string;
  end_time: string;
  room: string;
  max_students: string;
  tuition_per_session: string;
  start_date: string;
  end_date: string;
  total_sessions: string;
  description: string;
}

interface Props {
  classItem: Class | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const toFormValues = (c: Class): EditClassForm => ({
  class_name:           c.class_name,
  class_code:           c.class_code,
  level:                c.level,
  status:               c.status,
  teacher_id:           c.teacher_id,
  assistant_teacher_id: c.assistant_teacher_id ?? "",
  start_time:           c.start_time ?? "",
  end_time:             c.end_time ?? "",
  room:                 c.room_number ?? "",
  max_students:         c.max_students != null ? String(c.max_students) : "",
  tuition_per_session:  c.tuition_per_session != null ? String(c.tuition_per_session) : "",
  start_date:           c.start_date ? c.start_date.split("T")[0] : "",
  end_date:             c.end_date ? c.end_date.split("T")[0] : "",
  total_sessions:       c.total_sessions != null ? String(c.total_sessions) : "",
  description:          c.description ?? "",
});

const toDaysOfWeek = (c: Class): number[] => {
  if (c.days_of_week?.length > 0) return c.days_of_week;
  if (c.day_of_week != null) return [c.day_of_week];
  return [];
};

export default function EditClassModal({ classItem, isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<EditClassForm | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [errors, setErrors] = useState<Partial<EditClassForm> & { days?: string }>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    teachersAPI.getAll({ is_active: true, per_page: 50 }).then((r) => setTeachers(r.items));
  }, []);

  useEffect(() => {
    if (classItem) {
      setForm(toFormValues(classItem));
      setSelectedDays(toDaysOfWeek(classItem));
      setErrors({});
      setApiError("");
    }
  }, [classItem]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !classItem || !form) return null;

  const set = (field: keyof EditClassForm, value: string) => {
    setForm((f) => f ? { ...f, [field]: value } : f);
    if (errors[field as keyof typeof errors]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
    if (errors.days) setErrors((e) => ({ ...e, days: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<EditClassForm> & { days?: string } = {};
    if (!form.class_name.trim()) e.class_name = "Class name is required";
    if (!form.class_code.trim()) e.class_code = "Class code is required";
    if (!form.level)             e.level      = "Level is required";
    if (!form.teacher_id)        e.teacher_id = "Main teacher is required";
    if (selectedDays.length === 0) e.days     = "Select at least one day";
    if (form.max_students && isNaN(Number(form.max_students)))
      e.max_students = "Must be a number";
    if (form.tuition_per_session && isNaN(Number(form.tuition_per_session)))
      e.tuition_per_session = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      const payload: Record<string, unknown> = {
        class_name:    form.class_name.trim(),
        class_code:    form.class_code.trim(),
        level:         form.level,
        status:        form.status,
        teacher_id:    form.teacher_id,
        days_of_week:  selectedDays,
        day_of_week:   selectedDays[0] ?? 0,  // backward compat
      };

      if (form.assistant_teacher_id) payload.assistant_teacher_id = form.assistant_teacher_id;
      if (form.start_time)           payload.start_time  = form.start_time;
      if (form.end_time)             payload.end_time    = form.end_time;
      if (form.room)                 payload.room_number = form.room.trim();
      if (form.max_students)         payload.max_students = Number(form.max_students);
      if (form.tuition_per_session)  payload.tuition_per_session = Number(form.tuition_per_session);
      if (form.start_date)           payload.start_date  = form.start_date;
      if (form.end_date)             payload.end_date    = form.end_date;
      if (form.total_sessions)       payload.total_sessions = Number(form.total_sessions);
      if (form.description)          payload.description = form.description.trim();

      await classesAPI.update(classItem.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const levelGroups = CLASS_LEVELS.reduce((acc, l) => {
    if (!acc[l.group]) acc[l.group] = [];
    acc[l.group].push(l);
    return acc;
  }, {} as Record<string, typeof CLASS_LEVELS>);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Class</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-mono text-amber-600">{classItem.class_code}</span>
              {" · "}{classItem.class_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{apiError}</div>
          )}

          <Section title="Class Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Class Name" required error={errors.class_name}>
                <input value={form.class_name} onChange={(e) => set("class_name", e.target.value)}
                  className={inputCls(!!errors.class_name)} placeholder="e.g. IELTS Morning Group A" />
              </Field>
              <Field label="Class Code" required error={errors.class_code}>
                <input value={form.class_code} onChange={(e) => set("class_code", e.target.value)}
                  className={inputCls(!!errors.class_code)} placeholder="e.g. IELTS-2025-A" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Level" required error={errors.level}>
                <select value={form.level} onChange={(e) => set("level", e.target.value)}
                  className={inputCls(!!errors.level)}>
                  <option value="">Select level...</option>
                  {Object.entries(levelGroups).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls(false)}>
                  {CLASS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                className={`${inputCls(false)} resize-none`} rows={2}
                placeholder="Brief description of this class..." />
            </Field>
          </Section>

          <Section title="Teachers">
            <Field label="Main Teacher" required error={errors.teacher_id}>
              <select value={form.teacher_id} onChange={(e) => set("teacher_id", e.target.value)}
                className={inputCls(!!errors.teacher_id)}>
                <option value="">Select teacher...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </Field>
            <Field label="Assistant Teacher (optional)">
              <select value={form.assistant_teacher_id} onChange={(e) => set("assistant_teacher_id", e.target.value)}
                className={inputCls(false)}>
                <option value="">None</option>
                {teachers.filter((t) => t.id !== form.teacher_id)
                  .map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Schedule">
            {/* Days of Week toggles */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Days of Week <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedDays.includes(idx)
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedDays.map((d) => DAY_FULL[d]).join(" · ")}
                </p>
              )}
              {errors.days && <p className="mt-1 text-xs text-red-600">{errors.days}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputCls(false)} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputCls(false)} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Start Date">
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls(false)} />
              </Field>
              <Field label="End Date">
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputCls(false)} />
              </Field>
              <Field label="Total Sessions">
                <input type="number" min="1" value={form.total_sessions} onChange={(e) => set("total_sessions", e.target.value)}
                  className={inputCls(false)} placeholder="e.g. 24" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Room">
                <input value={form.room} onChange={(e) => set("room", e.target.value)}
                  className={inputCls(false)} placeholder="e.g. Room 2A" />
              </Field>
              <Field label="Max Students" error={errors.max_students}>
                <input type="number" min="1" max="50" value={form.max_students}
                  onChange={(e) => set("max_students", e.target.value)}
                  className={inputCls(!!errors.max_students)} placeholder="e.g. 15" />
              </Field>
            </div>
          </Section>

          <Section title="Financials">
            <Field label="Tuition Per Session (VND)" error={errors.tuition_per_session}>
              <input type="number" min="0" step="50000" value={form.tuition_per_session}
                onChange={(e) => set("tuition_per_session", e.target.value)}
                className={inputCls(!!errors.tuition_per_session)} placeholder="e.g. 150000" />
              {form.tuition_per_session && !isNaN(Number(form.tuition_per_session)) && Number(form.tuition_per_session) > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {Number(form.tuition_per_session).toLocaleString("vi-VN")} ₫/session
                </p>
              )}
            </Field>
          </Section>

        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2 min-w-[120px]">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Changes</>}
          </Button>
        </div>

      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white ${
    hasError ? "border-red-300 focus:ring-red-400 text-red-900" : "border-slate-200 focus:ring-amber-400 text-slate-900"
  }`;