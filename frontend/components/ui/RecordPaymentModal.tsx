"use client";

import { useState } from "react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: {
    student_id: string;
    student_name: string;
    enrollment_id: string;
    monthly_amount: number;
  };
  monthYear: string;   // "2026-03"
  monthLabel: string;  // "March 2026"
  currentStatus: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  student,
  monthYear,
  monthLabel,
  currentStatus,
}: RecordPaymentModalProps) {
  const [action, setAction] = useState<"paid" | "late" | "missed">("paid");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [amount, setAmount] = useState<string>(student.monthly_amount.toString());
  const [note, setNote] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isWaive = action === "paid" && Number(amount) === 0;

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("ttt_token="))
      ?.split("=")[1];

    try {
      const body: Record<string, unknown> = {
        student_id: student.student_id,
        enrollment_id: student.enrollment_id,
        month_year: monthYear,
        action,
        note: note || null,
      };

      if (action === "paid") {
        body.payment_method = paymentMethod;
        body.amount = Number(amount);
      }
      if (action === "late" && newDueDate) {
        body.new_due_date = newDueDate;
      }

      const res = await fetch(`${BASE}/payments/record/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const actionConfig = {
    paid: { label: "Mark Paid", color: "bg-emerald-500 hover:bg-emerald-600", icon: "✓" },
    late: { label: "Postpone", color: "bg-amber-500 hover:bg-amber-600", icon: "⏰" },
    missed: { label: "Mark Missed", color: "bg-red-500 hover:bg-red-600", icon: "✗" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Record Payment</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {student.student_name} · {monthLabel}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Action selector */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Action</label>
            <div className="grid grid-cols-3 gap-2">
              {(["paid", "late", "missed"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    action === a
                      ? a === "paid"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : a === "late"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-red-500/20 border-red-500 text-red-400"
                      : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {a === "paid" ? "✓ Paid" : a === "late" ? "⏰ Postpone" : "✗ Missed"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount (paid only) */}
          {action === "paid" && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                Amount (₫) <span className="text-slate-500 normal-case">— set 0 to waive</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              {isWaive && (
                <p className="text-xs text-amber-400 mt-1">⚡ This will mark as paid with waived fee</p>
              )}
            </div>
          )}

          {/* Payment method (paid only) */}
          {action === "paid" && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {(["cash", "bank_transfer"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      paymentMethod === m
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {m === "cash" ? "💵 Tiền mặt" : "🏦 Chuyển khoản"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New due date (postpone only) */}
          {action === "late" && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                New Due Date <span className="text-slate-500 normal-case">(optional)</span>
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
              Note <span className="text-slate-500 normal-case">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                action === "late"
                  ? "Reason for postponing..."
                  : action === "missed"
                  ? "Reason for missed payment..."
                  : "Any notes..."
              }
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none placeholder:text-slate-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${actionConfig[action].color}`}
          >
            {loading ? "Saving..." : actionConfig[action].label}
          </button>
        </div>
      </div>
    </div>
  );
}