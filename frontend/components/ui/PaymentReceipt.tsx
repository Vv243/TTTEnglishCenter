"use client";

interface ReceiptData {
  student_name: string;
  class_name: string;
  month_label: string;
  amount: number;
  payment_method: string;
  paid_date: string;
  recorded_by: string;
}

interface PaymentReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

export default function PaymentReceipt({ isOpen, onClose, data }: PaymentReceiptProps) {
  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const methodLabel = data.payment_method === "cash" ? "Tiền mặt / Cash" : "Chuyển khoản / Bank Transfer";

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-printable, #receipt-printable * { visibility: visible !important; }
          #receipt-printable {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 40px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm no-print" onClick={onClose} />

        <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
          {/* Actions bar */}
          <div className="no-print flex items-center justify-between px-5 py-3 bg-slate-100 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-600">Payment Receipt / Phiếu Thu</span>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors"
              >
                🖨 In phiếu / Print
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Receipt body */}
          <div id="receipt-printable" className="p-8 bg-white text-slate-800">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-xs text-slate-400 tracking-widest uppercase">Trung Tâm Anh Ngữ TTT</p>
              <h1 className="text-2xl font-bold tracking-wider mt-1">PHIẾU THU</h1>
              <p className="text-sm text-slate-500 mt-0.5">PAYMENT RECEIPT</p>
              <div className="w-16 h-0.5 bg-amber-400 mx-auto mt-3" />
            </div>

            {/* Fields */}
            <div className="space-y-3 text-sm">
              <ReceiptRow
                label="Học sinh / Student"
                value={data.student_name}
                bold
              />
              <ReceiptRow
                label="Lớp / Class"
                value={data.class_name}
              />
              <ReceiptRow
                label="Tháng / Month"
                value={data.month_label}
              />
              <div className="border-t border-dashed border-slate-200 pt-3 mt-3">
                <ReceiptRow
                  label="Số tiền / Amount"
                  value={formatVND(data.amount)}
                  bold
                  accent
                />
              </div>
              <ReceiptRow
                label="Hình thức / Method"
                value={methodLabel}
              />
              <ReceiptRow
                label="Ngày thu / Date"
                value={data.paid_date}
              />
              <ReceiptRow
                label="Thu bởi / Recorded by"
                value={data.recorded_by}
              />
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
              <div>
                <p>Người nộp tiền</p>
                <p className="text-slate-300">(Student / Parent)</p>
                <div className="mt-8 w-24 border-b border-slate-300" />
              </div>
              <div className="text-right">
                <p>Người thu tiền</p>
                <p className="text-slate-300">(Collector)</p>
                <div className="mt-8 w-24 border-b border-slate-300 ml-auto" />
              </div>
            </div>

            <p className="text-center text-xs text-slate-300 mt-4">
              Cảm ơn bạn đã tin tưởng TTT English Center 💛
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-right ${bold ? "font-semibold" : ""} ${
          accent ? "text-amber-600 text-base" : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}