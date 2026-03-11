"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentsAPI, classesAPI } from "@/lib/api";
import api from "@/lib/api";
import type { Student, Class } from "@/types";
import { X, Search } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_FORM = {
  student_id: "",
  class_id: "",
  agreed_tuition_per_session: 0,
  discount_percent: 0,
  status: "active" as "active" | "waitlisted",
  notes: "",
};

export default function AddEnrollmentModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    studentsAPI.getAll({ is_active: true, per_page: 100 }).then((r) => setStudents(r.items));
    classesAPI.getAll({ per_page: 100 }).then((r) => setClasses(r.items.filter((c) => c.status === "active" || c.status === "scheduled")));
  }, [isOpen]);

  // Auto-fill tuition when class is selected
  useEffect(() => {
    if (form.class_id) {
      const cls = classes.find((c) => c.id === form.class_id);
      if (cls) {
        const base = cls.tuition_per_session;
        const discounted = base * (1 - form.discount_percent / 100);
        setForm((f) => ({ ...f, agreed_tuition_per_session: Math.round(discounted) }));
      }
    }
  }, [form.class_id, form.discount_percent, classes]);

  if (!isOpen) return null;

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const filteredStudents = students.filter((s) =>
    !studentSearch || s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredClasses = classes.filter((c) =>
    !classSearch ||
    c.class_name.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.class_code.toLowerCase().includes(classSearch.toLowerCase())
  );

  const selectedStudent = students.find((s) => s.id === form.student_id);
  const selectedClass = classes.find((c) => c.id === form.class_id);

  const handleSubmit = async () => {
    setError("");
    if (!form.student_id) return setError("Please select a student.");
    if (!form.class_id) return setError("Please select a class.");
    if (form.agreed_tuition_per_session < 0) return setError("Tuition cannot be negative.");

    setLoading(true);
    try {
      await api.post("/enrollments/", {
        student_id: form.student_id,
        class_id: form.class_id,
        agreed_tuition_per_session: form.agreed_tuition_per_session,
        discount_percent: form.discount_percent,
        status: form.status,
      });
      onSuccess();
      onClose();
      setForm(INITIAL_FORM);
      setStudentSearch("");
      setClassSearch("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create enrollment. The student may already be enrolled in this class.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Enrollment</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enroll a student into an active class</p>
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

          {/* Student picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student <span className="text-red-500">*</span></label>
            {selectedStudent ? (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-semibold">
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedStudent.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{selectedStudent.grade_level?.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <button onClick={() => { set("student_id", ""); setStudentSearch(""); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-9"
                  />
                </div>
                {(studentSearch || true) && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">No students found</p>
                    ) : (
                      filteredStudents.slice(0, 8).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { set("student_id", s.id); setStudentSearch(""); }}
                          className="w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center gap-2 transition-colors"
                        >
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                            {s.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{s.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{s.grade_level?.replace(/_/g, " ")} · {s.parent_name}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Class picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class <span className="text-red-500">*</span></label>
            {selectedClass ? (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedClass.class_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{selectedClass.class_code} · {selectedClass.current_enrollment}/{selectedClass.max_students} students</p>
                </div>
                <button onClick={() => { set("class_id", ""); setClassSearch(""); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Search classes..."
                    className="pl-9"
                  />
                </div>
                {(classSearch || true) && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    {filteredClasses.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">No active classes found</p>
                    ) : (
                      filteredClasses.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { set("class_id", c.id); setClassSearch(""); }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.class_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{c.class_code} · {c.level.replace(/_/g, " ")}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.current_enrollment >= c.max_students ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                            {c.current_enrollment}/{c.max_students}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tuition */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tuition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount_percent}
                  onChange={(e) => set("discount_percent", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agreed Tuition / Session</label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={form.agreed_tuition_per_session}
                  onChange={(e) => set("agreed_tuition_per_session", Number(e.target.value))}
                />
              </div>
            </div>
            {selectedClass && (
              <p className="text-xs text-slate-400 mt-1">
                Class base rate: {formatCurrency(selectedClass.tuition_per_session)} VND/session
                {form.discount_percent > 0 && ` → ${form.discount_percent}% discount applied`}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Enrollment Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="active">Active — student starts immediately</option>
              <option value="waitlisted">Waitlisted — pending spot</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
            {loading ? "Enrolling..." : "Enroll Student"}
          </Button>
        </div>
      </div>
    </div>
  );
}



