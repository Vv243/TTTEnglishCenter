"use client";

import { useEffect, useState } from "react";

interface HistoryItem {
  id: string;
  month_year: string;
  month_label: string;
  amount: number;
  status: string;
  payment_method: string | null;
  paid_date: string | null;
  due_date: string;
  note: string | null;
  class_name: string | null;
  recorded_by_name: string | null;
}

interface StudentHistoryResponse {
  student_id: string;
  student_name: string;
  total_paid: number;
  total_missed: number;
  collection_rate: number;
  history: HistoryItem[];
}

interface StudentPaymentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400",
  late: "bg-amber-500/20 text-amber-400",
  missed: "bg-red-500/20 text-red-400",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
};

export default function StudentPaymentHistory({
  isOpen,
  onClose,
  studentId,
  studentName,
}: StudentPaymentHistoryProps) {
  const [data, setData] = useState<StudentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    setLoading(true);

    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("ttt_token="))
      ?.split("=")[1];

    fetch(`${BASE}/payments/student-history/${studentId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Payment History</h2>
            <p className="text-sm text-slate-400 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-700 shrink-0">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">{formatVND(data.total_paid)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Missed</p>
                <p className="text-lg font-bold text-red-400 font-mono">{formatVND(data.total_missed)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Collection Rate</p>
                <p
                  className={`text-lg font-bold font-mono ${
                    data.collection_rate >= 0.9
                      ? "text-emerald-400"
                      : data.collection_rate >= 0.7
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {(data.collection_rate * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* History table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800/95">
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
                    <th className="px-6 py-3 text-left">Month</th>
                    <th className="px-6 py-3 text-left">Class</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-left">Method</th>
                    <th className="px-6 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-700/40 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-3 text-white font-medium">{item.month_label}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{item.class_name || "—"}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-300">{formatVND(item.amount)}</td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[item.status] || "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-xs">
                        {item.payment_method ? METHOD_LABEL[item.payment_method] || item.payment_method : "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs max-w-32 truncate">
                        {item.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">No history found.</div>
        )}
      </div>
    </div>
  );
}