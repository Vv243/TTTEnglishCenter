"use client";
import { useState } from "react";
import { X, Lock, Eye, EyeOff, KeyRound, User, Mail, Phone, MessageCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { Teacher } from "@/types";

interface TeacherDetailModalProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function TeacherDetailModal({ teacher, isOpen, onClose, isAdmin }: TeacherDetailModalProps) {
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen || !teacher) return null;

  const handleClose = () => {
    setShowResetForm(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // Find the user account linked to this teacher
      await api.post(`/auth/reset-teacher-password/`, {
        teacher_id: teacher.id,
        new_password: newPassword,
      });
      setSuccess("Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setShowResetForm(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
              {teacher.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{teacher.full_name}</h2>
              <Badge variant={teacher.is_active ? "default" : "outline"} className="mt-1">
                {teacher.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact</h3>
            {teacher.email && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Mail className="h-4 w-4 text-slate-400" />
                {teacher.email}
              </div>
            )}
            {teacher.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" />
                {teacher.phone}
              </div>
            )}
            {teacher.zalo_id && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <MessageCircle className="h-4 w-4 text-slate-400" />
                Zalo: {teacher.zalo_id}
              </div>
            )}
          </div>

          {/* Specializations */}
          {teacher.specializations?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.specializations.map((s) => (
                  <span key={s} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {teacher.bio && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bio</h3>
              <p className="text-sm text-slate-600">{teacher.bio}</p>
            </div>
          )}

          {/* Password Reset — Admin only */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              {!showResetForm ? (
                <button
                  onClick={() => setShowResetForm(true)}
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </button>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Reset Password
                  </h3>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {success && <p className="text-green-600 text-sm">{success}</p>}
                  <div className="flex gap-2">
                    <Button onClick={handleResetPassword} disabled={loading} size="sm" className="bg-amber-500 hover:bg-amber-400 text-white">
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                    <Button onClick={() => setShowResetForm(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}