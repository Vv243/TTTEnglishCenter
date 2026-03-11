"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { X, UserPlus, CheckCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SPECIALIZATION_OPTIONS = [
  "Primary English",
  "Secondary English",
  "High School English",
  "Cambridge YLE (Starters/Movers/Flyers)",
  "KET / PET / FCE",
  "IELTS",
  "TOEFL",
  "SAT",
  "General English",
  "Phonics",
  "Speaking & Pronunciation",
];

const INITIAL_FORM = {
  // Login account fields
  username: "",
  password: "",
  // Teacher profile fields
  full_name: "",
  email: "",
  phone: "",
  zalo_id: "",
  role: "teacher" as "teacher" | "admin" | "assistant",
  bio: "",
  specializations: [] as string[],
};

export default function AddTeacherModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdName, setCreatedName] = useState("");

  if (!isOpen) return null;

  const set = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleSpec = (spec: string) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter((s) => s !== spec)
        : [...f.specializations, spec],
    }));
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setError("");
    setStep("form");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!form.full_name.trim()) return setError("Full name is required.");
    if (!form.username.trim()) return setError("Username is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (!form.phone.trim() || form.phone.trim().length < 10)
      return setError("Phone number is required (minimum 10 digits).");

    setLoading(true);
    try {
      // Step 1: Create login account in users table
      await api.post("/auth/register", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role === "assistant" ? "teacher" : form.role, // users table only has admin/teacher
        full_name: form.full_name.trim(),
      });

      // Step 2: Create teacher profile in teachers table
      await api.post("/teachers/", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        zalo_id: form.zalo_id.trim() || null,
        role: form.role,
        bio: form.bio.trim() || null,
        specializations: form.specializations,
        is_active: true,
        password: form.password, // required by TeacherCreate schema
      });

      setCreatedName(form.full_name.trim());
      setStep("success");
      onSuccess(); // refresh the teachers list immediately
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to create teacher. The username or email may already be taken."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="px-8 py-10 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Teacher Added!</h2>
            <p className="text-slate-500 text-sm mb-1">
              <span className="font-semibold text-slate-700">{createdName}</span> has been added successfully.
            </p>
            <p className="text-slate-400 text-xs mb-6">
              They can now log in with their username and password.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => { setForm(INITIAL_FORM); setStep("form"); }}
                variant="outline"
              >
                Add Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Teacher</h2>
              <p className="text-xs text-slate-500">Creates login account + teacher profile</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Profile */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="e.g. Nguyễn Thị Lan"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="e.g. 0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zalo ID</label>
                  <Input
                    value={form.zalo_id}
                    onChange={(e) => set("zalo_id", e.target.value)}
                    placeholder="e.g. 0901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="teacher">Teacher</option>
                  <option value="assistant">Assistant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio (optional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={2}
                  placeholder="Brief background or teaching style..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpec(spec)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    form.specializations.includes(spec)
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Login Account */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Login Account</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="e.g. co_lan@tttenglish.vn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.username}
                  onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  placeholder="e.g. co_lan"
                />
                <p className="text-xs text-slate-400 mt-1">Used to log in. Lowercase, underscores only.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? "Creating..." : "Add Teacher"}
          </Button>
        </div>
      </div>
    </div>
  );
}