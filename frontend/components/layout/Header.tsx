"use client";

import { Bell, Search, LogOut, User, KeyRound, Settings, X, CheckCircle, Clock, AlertTriangle, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { authStorage, AuthUser } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

// ── Notification types ────────────────────────────────────────
interface Notification {
  id: string;
  type: "attendance" | "payment" | "enrollment" | "cancellation";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ── Change Password Modal ─────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (form.next !== form.confirm) return setError("New passwords do not match.");
    if (form.next.length < 6) return setError("Password must be at least 6 characters.");
    setSaving(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: form.current,
        new_password: form.next,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
              <CheckCircle className="h-5 w-5" /> Password changed successfully!
            </div>
          ) : (
            <>
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={form.current}
                  onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={form.next}
                  onChange={e => setForm(f => ({ ...f, next: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </>
          )}
        </div>
        {!success && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-100">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Change Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────
export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showBell, setShowBell] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  // Generate recent activity notifications
  useEffect(() => {
    const baseNotifs: Notification[] = [
      {
        id: "1",
        type: "enrollment",
        title: "New Enrollment",
        message: "Hoàng Minh Khôi enrolled in TOEFL 100+ Intensive",
        time: "2 hours ago",
        read: false,
      },
      {
        id: "2",
        type: "payment",
        title: "Payment Recorded",
        message: "March payment recorded for IELTS Writing 7.0",
        time: "Yesterday",
        read: false,
      },
      {
        id: "3",
        type: "cancellation",
        title: "Session Cancelled",
        message: "IELTS Writing 7.0 session on Mar 16 was cancelled",
        time: "Today",
        read: false,
      },
      {
        id: "4",
        type: "attendance",
        title: "Attendance Recorded",
        message: "TOEFL 100+ Intensive — Mar 9, 2026",
        time: "5 days ago",
        read: false,
      },
    ];

    // Load read state from localStorage
    try {
      const readIds: string[] = JSON.parse(localStorage.getItem("ttt_read_notifs") || "[]");
      const notifs = baseNotifs.map(n => ({ ...n, read: readIds.includes(n.id) }));
      setNotifications(notifs);
    } catch {
      setNotifications(baseNotifs);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatar(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    router.push("/login");
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem("ttt_read_notifs", JSON.stringify(updated.map(n => n.id)));
      } catch {}
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() ?? "A";

  const displayName = user?.full_name || user?.username || "Admin User";
  const displayRole = user?.role === "admin" ? "System Administrator" : "Teacher";

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "attendance":   return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "payment":      return <Clock className="h-4 w-4 text-amber-500" />;
      case "enrollment":   return <User className="h-4 w-4 text-blue-500" />;
      case "cancellation": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:             return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
        {/* Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, classes, teachers..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* ── Bell Notifications ── */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setShowBell(v => !v); setShowAvatar(false); }}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showBell && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-amber-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 text-sm">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${!n.read ? "bg-amber-50/50" : ""}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.read ? "text-slate-900" : "text-slate-600"}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                        </div>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => { setShowBell(false); router.push("/attendance"); }}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    View attendance →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Avatar + Name + Dropdown ── */}
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => { setShowAvatar(v => !v); setShowBell(false); }}
              className="flex items-center gap-3 border-l border-slate-200 pl-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{displayRole}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
            </button>

            {showAvatar && (
              <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                {/* Profile header */}
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{displayRole}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setShowAvatar(false); setShowChangePassword(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-slate-400" />
                    Change Password
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => { setShowAvatar(false); router.push("/teachers"); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Manage Teachers
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
}