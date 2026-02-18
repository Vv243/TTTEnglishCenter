"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { studentsAPI } from "@/lib/api";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // triggers refetch in parent
}

const GRADE_LEVELS = [
  { value: "primary_1", label: "Primary 1" },
  { value: "primary_2", label: "Primary 2" },
  { value: "primary_3", label: "Primary 3" },
  { value: "primary_4", label: "Primary 4" },
  { value: "primary_5", label: "Primary 5" },
  { value: "secondary_6", label: "Secondary 6" },
  { value: "secondary_7", label: "Secondary 7" },
  { value: "secondary_8", label: "Secondary 8" },
  { value: "secondary_9", label: "Secondary 9" },
  { value: "high_10", label: "High 10" },
  { value: "high_11", label: "High 11" },
  { value: "high_12", label: "High 12" },
];

const HCM_DISTRICTS = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
  "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "Phú Nhuận",
  "Tân Bình", "Tân Phú", "Thủ Đức", "Bình Tân", "Hóc Môn",
  "Củ Chi", "Bình Chánh", "Nhà Bè", "Cần Giờ",
];

interface FormData {
  full_name: string;
  date_of_birth: string;
  grade_level: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  parent_zalo: string;
  district: string;
  address: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  full_name: "",
  date_of_birth: "",
  grade_level: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  parent_zalo: "",
  district: "",
  address: "",
  notes: "",
};

interface FieldErrors {
  [key: string]: string;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  if (!isOpen) return null;

  const set = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.full_name.trim())   newErrors.full_name   = "Student name is required";
    if (!form.date_of_birth)      newErrors.date_of_birth = "Date of birth is required";
    if (!form.grade_level)        newErrors.grade_level  = "Grade level is required";
    if (!form.parent_name.trim()) newErrors.parent_name  = "Parent name is required";
    if (!form.parent_phone.trim()) newErrors.parent_phone = "Parent phone is required";
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.parent_phone.trim()))
      newErrors.parent_phone = "Enter a valid phone number";
    if (form.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parent_email))
      newErrors.parent_email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      await studentsAPI.create({
        full_name:    form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        grade_level:  form.grade_level,
        parent_name:  form.parent_name.trim(),
        parent_phone: form.parent_phone.trim(),
        parent_email: form.parent_email.trim() || null,
        parent_zalo:  form.parent_zalo.trim() || null,
        district:     form.district || null,
        address:      form.address.trim() || null,
        notes:        form.notes.trim() || null,
        city:         "Ho Chi Minh City",
        payment_cluster: "new_student",
      });
      setForm(INITIAL_FORM);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setServerError(error?.response?.data?.detail || "Failed to create student. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(INITIAL_FORM);
    setErrors({});
    setServerError("");
    onClose();
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-200"
    }`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the student and parent details</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Server error */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Section: Student Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Student Information
            </h3>
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nguyễn Văn An"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={inputClass("full_name")}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </div>

              {/* DOB + Grade Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                    className={inputClass("date_of_birth")}
                  />
                  {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.grade_level}
                    onChange={(e) => set("grade_level", e.target.value)}
                    className={inputClass("grade_level")}
                  >
                    <option value="">Select grade...</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  {errors.grade_level && <p className="text-xs text-red-500 mt-1">{errors.grade_level}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Parent Contact */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Parent / Guardian Contact
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Parent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nguyễn Thị Lan"
                  value={form.parent_name}
                  onChange={(e) => set("parent_name", e.target.value)}
                  className={inputClass("parent_name")}
                />
                {errors.parent_name && <p className="text-xs text-red-500 mt-1">{errors.parent_name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0901234567"
                    value={form.parent_phone}
                    onChange={(e) => set("parent_phone", e.target.value)}
                    className={inputClass("parent_phone")}
                  />
                  {errors.parent_phone && <p className="text-xs text-red-500 mt-1">{errors.parent_phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zalo ID</label>
                  <input
                    type="text"
                    placeholder="Zalo phone or ID"
                    value={form.parent_zalo}
                    onChange={(e) => set("parent_zalo", e.target.value)}
                    className={inputClass("parent_zalo")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={form.parent_email}
                  onChange={(e) => set("parent_email", e.target.value)}
                  className={inputClass("parent_email")}
                />
                {errors.parent_email && <p className="text-xs text-red-500 mt-1">{errors.parent_email}</p>}
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <select
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  className={inputClass("district")}
                >
                  <option value="">Select district...</option>
                  {HCM_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputClass("address")}
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Additional Notes
            </h3>
            <textarea
              placeholder="Any notes about the student (optional)..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Add Student"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}