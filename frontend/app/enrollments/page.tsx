"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enrollmentsAPI } from "@/lib/api";
import type { Enrollment, PaginatedResponse } from "@/types";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export default function EnrollmentsPage() {
  const [data, setData] = useState<PaginatedResponse<Enrollment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      try {
        const result = await enrollmentsAPI.getAll({
          page,
          per_page: perPage,
        });
        setData(result);
      } catch (error) {
        console.error("Failed to fetch enrollments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "default";
      case "dropped":
        return "destructive";
      case "suspended":
        return "warning";
      case "waitlisted":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading enrollments...</div>
      </div>
    );
  }

  const enrollments = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Enrollments
          </h1>
          <p className="text-slate-600">
            Track student progress and class assignments
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          + New Enrollment
        </Button>
      </div>

      {/* Enrollments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Class</th>
                <th className="px-6 py-4 text-left">Attendance</th>
                <th className="px-6 py-4 text-left">Performance</th>
                <th className="px-6 py-4 text-left">Tuition</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enrollment, index) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-slate-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {enrollment.student?.full_name?.charAt(0).toUpperCase() ||
                          "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {enrollment.student?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Enrolled:{" "}
                          {new Date(enrollment.enrollment_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Class */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {enrollment.class?.class_name || "Unknown"}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        {enrollment.class?.class_code || "-"}
                      </p>
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {enrollment.attendance_rate
                            ? `${Math.round(enrollment.attendance_rate)}%`
                            : "-"}
                        </span>
                      </div>
                      {(enrollment.absences > 0 || enrollment.tardies > 0) && (
                        <p className="text-xs text-slate-500">
                          {enrollment.absences} absent, {enrollment.tardies} late
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {enrollment.average_score !== null ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold font-mono text-slate-900">
                              {enrollment.average_score.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">avg</span>
                          </div>
                          {enrollment.progress_trend && (
                            <div className="flex items-center gap-1">
                              {enrollment.progress_trend === "improving" ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-xs capitalize text-slate-600">
                                {enrollment.progress_trend}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">No data</span>
                      )}
                    </div>
                  </td>

                  {/* Tuition */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-mono font-semibold text-slate-900">
                        {formatCurrency(enrollment.agreed_tuition_per_session)}
                      </p>
                      {enrollment.discount_percent > 0 && (
                        <p className="text-xs text-green-600">
                          -{enrollment.discount_percent}% discount
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <Badge variant={getStatusColor(enrollment.status)}>
                      {enrollment.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * perPage + 1} to{" "}
              {Math.min(page * perPage, data.total)} of {data.total} enrollments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-mono text-slate-600">
                Page {page} of {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
