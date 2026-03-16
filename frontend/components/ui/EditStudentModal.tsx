"use client";

import { useEffect, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { studentsAPI } from "@/lib/api";
import type { GradeLevel } from "@/types";
import type { Student } from "@/types";

const GRADE_LEVELS = [
  { value: "primary_1",   label: "Primary 1" },
  { value: "primary_2",   label: "Primary 2" },
  { value: "primary_3",   label: "Primary 3" },
  { value: "primary_4",   label: "Primary 4" },
  { value: "primary_5",   label: "Primary 5" },
  { value: "secondary_6", label: "Secondary 6" },
  { value: "secondary_7", label: "Secondary 7" },
  { value: "secondary_8", label: "Secondary 8" },
  { value: "secondary_9", label: "Secondary 9" },
  { value: "high_10",     label: "High 10" },
  { value: "high_11",     label: "High 11" },
  { value: "high_12",     label: "High 12" },
  { value: "adult",       label: "Adult Learner" },
];

const PAYMENT_CLUSTERS = [
  { value: "always_on_time",  label: "Always On Time" },
  { value: "new_student",     label: "New Student" },
  { value: "needs_reminder",  label: "Needs Reminder" },
  { value: "high_risk",       label: "High Risk" },
  { value: "erratic",         label: "Erratic" },
];

const VIETNAM_PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Bình Định", "Cao Bằng", "Cà Mau", "Đắk Lắk",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên",
  "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An",
  "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sơn La", "Tây Ninh", "Thanh Hóa", "Thái Nguyên", "Vĩnh Long",
];

interface EditStudentForm {
  full_name: string;
  date_of_birth: string;
  grade_level: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  parent_zalo: string;
  street_address: string;
  ward: string;
  province_city: string;
  english_level: string;
  target_exam: string;
  payment_cluster: string;
  notes: string;
  medical_notes: string;
}

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const toFormValues = (s: Student): EditStudentForm => ({
  full_name:       s.full_name,
  date_of_birth:   s.date_of_birth ? s.date_of_birth.split("T")[0] : "",
  grade_level:     s.grade_level ?? "",
  parent_name:     s.parent_name,
  parent_phone:    s.parent_phone,
  parent_email:    s.parent_email ?? "",
  parent_zalo:  s.parent_zalo ?? "",
  street_address:  s.street_address ?? "",
  ward:            s.ward ?? "",
  province_city:   s.province_city ?? "",
  english_level:   s.english_level ?? "",
  target_exam:     s.target_exam ?? "",
  payment_cluster: s.payment_cluster,
  notes:           s.notes ?? "",
  medical_notes:   s.medical_notes ?? "",
});

const EMPTY_FORM: EditStudentForm = {
  full_name: "", date_of_birth: "", grade_level: "", parent_name: "",
  parent_phone: "", parent_email: "", parent_zalo: "", street_address: "",
  ward: "", province_city: "", english_level: "", target_exam: "",
  payment_cluster: "new_student", notes: "", medical_notes: "",
};

export default function EditStudentModal({ student, isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<EditStudentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<EditStudentForm>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (student) {
      setForm(toFormValues(student));
      setErrors({});
      setApiError("");
    }
  }, [student]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const set = (field: keyof EditStudentForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<EditStudentForm> = {};
    if (!form.full_name.trim())    e.full_name    = "Student name is required";
    if (!form.date_of_birth)       e.date_of_birth = "Date of birth is required";
    if (!form.grade_level)         e.grade_level   = "Grade level is required";
    if (!form.parent_name.trim())  e.parent_name   = "Parent name is required";
    if (!form.parent_phone.trim()) e.parent_phone  = "Parent phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      const payload: Record<string, unknown> = {
        full_name:       form.full_name.trim(),
        date_of_birth:   form.date_of_birth,
        grade_level:     form.grade_level,
        parent_name:     form.parent_name.trim(),
        parent_phone:    form.parent_phone.trim(),
        payment_cluster: form.payment_cluster,
      };
      if (form.parent_email)   payload.parent_email   = form.parent_email.trim();
      if (form.parent_zalo) payload.parent_zalo = form.parent_zalo.trim();
      if (form.street_address) payload.street_address = form.street_address.trim();
      if (form.ward)           payload.ward           = form.ward.trim();
      if (form.province_city)  payload.province_city  = form.province_city;
      if (form.english_level)  payload.english_level  = form.english_level.trim();
      if (form.target_exam)    payload.target_exam    = form.target_exam.trim();
      if (form.notes)          payload.notes          = form.notes.trim();
      if (form.medical_notes)  payload.medical_notes  = form.medical_notes.trim();

      await studentsAPI.update(student.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Student</h2>
            <p className="text-sm text-slate-500 mt-0.5">{student.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{apiError}</div>
          )}

          <Section title="Student Information">
            <Field label="Full Name" required error={errors.full_name}>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                className={inputCls(!!errors.full_name)} placeholder="Nguyễn Văn A" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Birth" required error={errors.date_of_birth}>
                <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)}
                  className={inputCls(!!errors.date_of_birth)} />
              </Field>
              <Field label="Grade Level" required error={errors.grade_level}>
                <select value={form.grade_level} onChange={(e) => set("grade_level", e.target.value)}
                  className={inputCls(!!errors.grade_level)}>
                  <option value="">Select grade...</option>
                  {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="English Level">
                <input value={form.english_level} onChange={(e) => set("english_level", e.target.value)}
                  className={inputCls(false)} placeholder="e.g. Beginner, KET, IELTS 5.5" />
              </Field>
              <Field label="Target Exam">
                <input value={form.target_exam} onChange={(e) => set("target_exam", e.target.value)}
                  className={inputCls(false)} placeholder="e.g. IELTS, FCE, SAT" />
              </Field>
            </div>
          </Section>

          <Section title="Parent / Guardian">
            <Field label="Parent Name" required error={errors.parent_name}>
              <input value={form.parent_name} onChange={(e) => set("parent_name", e.target.value)}
                className={inputCls(!!errors.parent_name)} placeholder="Nguyễn Thị B" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" required error={errors.parent_phone}>
                <input value={form.parent_phone} onChange={(e) => set("parent_phone", e.target.value)}
                  className={inputCls(!!errors.parent_phone)} placeholder="0901 234 567" />
              </Field>
              <Field label="Zalo ID">
                <input value={form.parent_zalo} onChange={(e) => set("parent_zalo", e.target.value)}
                  className={inputCls(false)} placeholder="Zalo phone or ID" />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" value={form.parent_email} onChange={(e) => set("parent_email", e.target.value)}
                className={inputCls(false)} placeholder="optional@email.com" />
            </Field>
          </Section>

          <Section title="Address">
            <Field label="Street Address">
              <input value={form.street_address} onChange={(e) => set("street_address", e.target.value)}
                className={inputCls(false)} placeholder="45A Nguyễn Đình Chiểu" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ward (Phường / Xã)">
                <input value={form.ward} onChange={(e) => set("ward", e.target.value)}
                  className={inputCls(false)} placeholder="e.g. Phường Đa Kao" />
              </Field>
              <Field label="Province / City">
                <select value={form.province_city} onChange={(e) => set("province_city", e.target.value)}
                  className={inputCls(false)}>
                  <option value="">Select province...</option>
                  {VIETNAM_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Payment & Admin">
            <Field label="Payment Cluster">
              <select value={form.payment_cluster} onChange={(e) => set("payment_cluster", e.target.value)}
                className={inputCls(false)}>
                {PAYMENT_CLUSTERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                className={`${inputCls(false)} resize-none`} rows={3}
                placeholder="Any general notes about the student..." />
            </Field>
            <Field label="Medical Notes">
              <textarea value={form.medical_notes} onChange={(e) => set("medical_notes", e.target.value)}
                className={`${inputCls(false)} resize-none`} rows={2}
                placeholder="Allergies, medications, or health considerations..." />
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