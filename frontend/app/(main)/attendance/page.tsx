"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import {
  ChevronLeft, ChevronRight, CheckCircle, Clock, X,
  Users, Calendar, ClipboardList, AlertTriangle
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface TodayClass {
  class_id: string;
  class_name: string;
  class_code: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  level: string;
  enrolled_count: number;
  attendance_recorded: boolean;
  is_cancelled: boolean;
  session_date: string;
}

interface AttendanceRecord {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  grade_level: string | null;
  status: "present" | "absent" | "late";
  note: string;
}

interface SessionData {
  class_id: string;
  class_name: string;
  session_date: string;
  session_type: string;
  already_recorded: boolean;
  records: any[];
  unrecorded_students: {
    enrollment_id: string;
    student_id: string;
    student_name: string;
    grade_level: string | null;
  }[];
}

// ── Helpers ───────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
};

const formatTime = (t: string) => t.slice(0, 5);

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const todayStr = () => new Date().toISOString().split("T")[0];

const STATUS_COLORS = {
  present: "bg-green-500 text-white border-green-500",
  late:    "bg-amber-500 text-white border-amber-500",
  absent:  "bg-red-500 text-white border-red-500",
};
const STATUS_IDLE = "bg-white text-slate-400 border-slate-200 hover:border-slate-300";

// ── Cancel Session Modal ──────────────────────────────────────
function CancelSessionModal({
  cls, sessionDate, onClose, onConfirm,
}: {
  cls: TodayClass;
  sessionDate: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Vietnamese message for parents (kept Vietnamese — this is sent to parents)
  const message = `Kính gửi quý phụ huynh và các em học sinh,\n\nBuổi học ${cls.class_name} vào ${formatDate(sessionDate)} (${formatTime(cls.start_time)}–${formatTime(cls.end_time)}) sẽ được hoãn lại.${reason ? `\n\nLý do: ${reason}` : ""}\n\nNhà trường sẽ thông báo lịch bù sớm nhất. Xin lỗi vì sự bất tiện này.\n\nTrân trọng,\nTrung tâm Tiếng Anh TTT`;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await api.post("/attendance/cancel-session/", {
        class_id: cls.class_id,
        session_date: sessionDate,
        reason,
        message_sent: message,
      });
      onConfirm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cancel Session</h2>
            <p className="text-sm text-slate-500">{cls.class_name} · {formatDate(sessionDate)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Teacher is sick, public holiday..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Parent notification message
              <span className="ml-2 text-xs text-slate-400 font-normal">(Vietnamese — for Zalo/email)</span>
            </label>
            <textarea
              value={message}
              readOnly
              rows={8}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-mono resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">Copy this message to send via Zalo or email to parents.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
            {saving ? "Saving..." : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Session Marking View ──────────────────────────────────────
function SessionView({
  classId, sessionDate, onBack, onSaved,
}: {
  classId: string;
  sessionDate: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessionType, setSessionType] = useState<"regular" | "makeup">("regular");
  const [makeupReason, setMakeupReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/attendance/session/", {
        params: { class_id: classId, session_date: sessionDate },
      });
      const data: SessionData = res.data;
      setSession(data);
      setSessionType((data.session_type as any) || "regular");

      if (data.already_recorded) {
        setRecords(data.records.map((r: any) => ({
          enrollment_id: r.enrollment_id,
          student_id: r.student_id,
          student_name: r.student_name || "Unknown",
          grade_level: null,
          status: r.status,
          note: r.note || "",
        })));
      } else {
        setRecords(data.unrecorded_students.map(s => ({
          enrollment_id: s.enrollment_id,
          student_id: s.student_id,
          student_name: s.student_name,
          grade_level: s.grade_level,
          status: "present" as const,
          note: "",
        })));
      }
    } catch (e) {
      setError("Failed to load session data.");
    } finally {
      setLoading(false);
    }
  }, [classId, sessionDate]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const setStatus = (enrollmentId: string, status: "present" | "absent" | "late") => {
    setRecords(prev => prev.map(r => r.enrollment_id === enrollmentId ? { ...r, status } : r));
  };

  const setNote = (enrollmentId: string, note: string) => {
    setRecords(prev => prev.map(r => r.enrollment_id === enrollmentId ? { ...r, note } : r));
  };

  const markAllPresent = () => {
    setRecords(prev => prev.map(r => ({ ...r, status: "present" as const })));
  };

  const handleSubmit = async () => {
    if (sessionType === "makeup" && !makeupReason) {
      setError("Please enter a reason for the makeup session.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/attendance/bulk/", {
        class_id: classId,
        session_date: sessionDate,
        session_type: sessionType,
        makeup_reason: makeupReason || null,
        records: records.map(r => ({
          enrollment_id: r.enrollment_id,
          student_id: r.student_id,
          status: r.status,
          note: r.note || null,
        })),
      });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
      loadSession();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter(r => r.status === "present").length;
  const lateCount    = records.filter(r => r.status === "late").length;
  const absentCount  = records.filter(r => r.status === "absent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{session?.class_name || "Loading..."}</h2>
          <p className="text-slate-500 text-sm">{formatDate(sessionDate)}</p>
        </div>
        {session?.already_recorded && (
          <Badge variant="success" className="ml-2">Already Recorded</Badge>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {saved && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Attendance saved successfully!
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">Loading session...</div>
      ) : (
        <>
          {/* Session type */}
          <Card className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Session type:</span>
                <button
                  onClick={() => setSessionType("regular")}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${sessionType === "regular" ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Regular
                </button>
                <button
                  onClick={() => setSessionType("makeup")}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${sessionType === "makeup" ? "bg-blue-500 text-white border-blue-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Makeup
                </button>
              </div>
              {sessionType === "makeup" && (
                <input
                  value={makeupReason}
                  onChange={e => setMakeupReason(e.target.value)}
                  placeholder="Reason for makeup session (required)..."
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              )}
            </div>
          </Card>

          {/* Summary + mark all */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> {presentCount} present
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <Clock className="h-4 w-4" /> {lateCount} late
              </span>
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <X className="h-4 w-4" /> {absentCount} absent
              </span>
            </div>
            <Button
              variant="outline"
              onClick={markAllPresent}
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4" /> Mark All Present
            </Button>
          </div>

          {/* Student list */}
          <Card className="overflow-hidden">
            {records.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No enrolled students in this class</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {records.map((record, index) => (
                  <div
                    key={record.enrollment_id}
                    className="px-6 py-4 flex items-center gap-4 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                      record.status === "present" ? "bg-green-500" :
                      record.status === "late"    ? "bg-amber-500" : "bg-red-400"
                    }`}>
                      {record.student_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{record.student_name}</p>
                      {record.grade_level && (
                        <p className="text-xs text-slate-400 capitalize">{record.grade_level.replace(/_/g, " ")}</p>
                      )}
                    </div>

                    {/* Status buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStatus(record.enrollment_id, "present")}
                        className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-all ${record.status === "present" ? STATUS_COLORS.present : STATUS_IDLE}`}
                      >
                        ✅ Present
                      </button>
                      <button
                        onClick={() => setStatus(record.enrollment_id, "late")}
                        className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-all ${record.status === "late" ? STATUS_COLORS.late : STATUS_IDLE}`}
                      >
                        ⏰ Late
                      </button>
                      <button
                        onClick={() => setStatus(record.enrollment_id, "absent")}
                        className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-all ${record.status === "absent" ? STATUS_COLORS.absent : STATUS_IDLE}`}
                      >
                        ❌ Absent
                      </button>
                    </div>

                    {/* Note */}
                    <input
                      value={record.note}
                      onChange={e => setNote(record.enrollment_id, e.target.value)}
                      placeholder="Note..."
                      className="w-32 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 text-slate-600"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Submit */}
          {records.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 gap-2"
              >
                <ClipboardList className="h-4 w-4" />
                {saving ? "Saving..." : session?.already_recorded ? "Update Attendance" : "Save Attendance"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Attendance Page ──────────────────────────────────────
export default function AttendancePage() {
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || todayStr()
  );
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<{ classId: string; date: string } | null>(
    searchParams.get("class_id")
      ? { classId: searchParams.get("class_id")!, date: searchParams.get("date") || todayStr() }
      : null
  );
  const [cancelModal, setCancelModal] = useState<TodayClass | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/attendance/today/", {
        params: { target_date: selectedDate },
      });
      setClasses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const isToday = selectedDate === todayStr();

  const maxDate = addDays(todayStr(), 7);

  const navigateDate = (delta: number) => {
    const newDate = addDays(selectedDate, delta);
    if (newDate > maxDate) return;
    setSelectedDate(newDate);
    setActiveSession(null);
  };

  if (activeSession) {
    return (
      <div className="space-y-6">
        <SessionView
          classId={activeSession.classId}
          sessionDate={activeSession.date}
          onBack={() => { setActiveSession(null); fetchClasses(); }}
          onSaved={fetchClasses}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Attendance</h1>
          <p className="text-slate-600">Mark and review session attendance</p>
        </div>
      </div>

      {/* Date navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">{formatDate(selectedDate)}</p>
            {isToday && <span className="text-xs text-amber-600 font-medium">Today</span>}
          </div>
          <button
            onClick={() => navigateDate(1)}
            disabled={selectedDate >= maxDate}
            className={`p-2 rounded-lg transition-colors ${selectedDate >= maxDate ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {selectedDate !== todayStr() && (
          <div className="mt-3 text-center">
            <button
              onClick={() => { setSelectedDate(todayStr()); setActiveSession(null); }}
              className="text-xs text-amber-600 hover:underline font-medium"
            >
              Back to today
            </button>
          </div>
        )}
      </Card>

      {/* Classes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No classes scheduled for this day</p>
          <p className="text-slate-400 text-sm mt-1">{selectedDate > todayStr() ? "No classes scheduled — you can cancel a future session from here." : "Navigate to a different date or add a makeup session."}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map(cls => (
            <Card key={cls.class_id} className={`overflow-hidden transition-all ${cls.is_cancelled ? "opacity-60" : ""}`}>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Time badge */}
                  <div className="text-center bg-slate-50 rounded-xl px-3 py-2 min-w-[70px]">
                    <p className="text-lg font-bold font-mono text-slate-900">{formatTime(cls.start_time)}</p>
                    <p className="text-xs text-slate-400">{formatTime(cls.end_time)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-lg">{cls.class_name}</span>
                      <span className="text-xs font-mono text-slate-400">{cls.class_code}</span>
                      {cls.is_cancelled && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">Cancelled</span>
                      )}
                      {cls.attendance_recorded && !cls.is_cancelled && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Recorded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {cls.room_number && <span>📍 {cls.room_number}</span>}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {cls.enrolled_count} students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!cls.is_cancelled && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Past dates — edit attendance only */}
                    {selectedDate < todayStr() && (
                      <Button
                        onClick={() => setActiveSession({ classId: cls.class_id, date: selectedDate })}
                        className="gap-2 bg-slate-700 hover:bg-slate-800 text-white"
                      >
                        <ClipboardList className="h-4 w-4" />
                        {cls.attendance_recorded ? "Edit Attendance" : "Take Attendance"}
                      </Button>
                    )}
                    {/* Today — take/edit attendance AND cancel */}
                    {selectedDate === todayStr() && (
                      <>
                        <Button
                          onClick={() => setActiveSession({ classId: cls.class_id, date: selectedDate })}
                          className={`gap-2 ${cls.attendance_recorded ? "bg-slate-700 hover:bg-slate-800" : "bg-amber-500 hover:bg-amber-600"} text-white`}
                        >
                          <ClipboardList className="h-4 w-4" />
                          {cls.attendance_recorded ? "Edit Attendance" : "Take Attendance"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCancelModal(cls)}
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Cancel Session
                        </Button>
                      </>
                    )}
                    {/* Future dates — cancel only */}
                    {selectedDate > todayStr() && (
                      <Button
                        variant="outline"
                        onClick={() => setCancelModal(cls)}
                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Cancel Session
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Session Modal */}
      {cancelModal && (
        <CancelSessionModal
          cls={cancelModal}
          sessionDate={selectedDate}
          onClose={() => setCancelModal(null)}
          onConfirm={() => { setCancelModal(null); fetchClasses(); }}
        />
      )}
    </div>
  );
}