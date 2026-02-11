"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { studentsAPI } from "@/lib/api";
import type { Student, PaginatedResponse } from "@/types";
import { ChevronLeft, ChevronRight, MapPin, Phone, Users } from "lucide-react";

export default function StudentsPage() {
  const [data, setData] = useState<PaginatedResponse<Student> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const result = await studentsAPI.getAll({
          page,
          per_page: perPage,
          is_active: true,
        });
        setData(result);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [page]);

  const getPaymentClusterColor = (cluster: string) => {
    switch (cluster) {
      case "always_on_time":
        return "success";
      case "new_student":
        return "default";
      case "needs_reminder":
        return "warning";
      case "high_risk":
        return "destructive";
      case "erratic":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatGradeLevel = (level: string | null) => {
    if (!level) return "-";
    return level.replace("_", " ").toUpperCase();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading students...</div>
      </div>
    );
  }

  const students = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Students</h1>
          <p className="text-slate-600">
            Manage student enrollments and information
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          + Add Student
        </Button>
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Grade Level</th>
                <th className="px-6 py-4 text-left">Parent Contact</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-left">Payment Cluster</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Student Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Enrolled:{" "}
                          {new Date(student.enrollment_date).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Grade Level */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-mono bg-blue-50 text-blue-700 rounded-full">
                      {formatGradeLevel(student.grade_level)}
                    </span>
                  </td>

                  {/* Parent Contact */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{student.parent_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{student.parent_phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-3 w-3" />
                      <div>
                        <p className="font-medium">
                          {student.district || "Unknown District"}
                        </p>
                        <p className="text-xs text-slate-500">{student.city}</p>
                      </div>
                    </div>
                  </td>

                  {/* Payment Cluster */}
                  <td className="px-6 py-4">
                    <Badge variant={getPaymentClusterColor(student.payment_cluster)}>
                      {student.payment_cluster.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <Badge variant={student.is_active ? "success" : "outline"}>
                      {student.is_active ? "Active" : "Inactive"}
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
              {Math.min(page * perPage, data.total)} of {data.total} students
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
