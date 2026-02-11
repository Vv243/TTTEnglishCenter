"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { teachersAPI } from "@/lib/api";
import type { Teacher, PaginatedResponse } from "@/types";
import { Mail, Phone, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function TeachersPage() {
  const [data, setData] = useState<PaginatedResponse<Teacher> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const result = await teachersAPI.getAll({
          page,
          per_page: perPage,
          is_active: true,
        });
        setData(result);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [page]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading teachers...</div>
      </div>
    );
  }

  const teachers = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Teachers</h1>
          <p className="text-slate-600">
            Manage teaching staff and their information
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          + Add Teacher
        </Button>
      </div>

      {/* Teachers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">Teacher</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Specializations</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((teacher, index) => (
                <tr
                  key={teacher.id}
                  className="hover:bg-slate-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Teacher Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                        {teacher.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {teacher.full_name}
                        </p>
                        <p className="text-sm text-slate-500 font-mono">
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        teacher.role === "admin"
                          ? "destructive"
                          : teacher.role === "teacher"
                          ? "default"
                          : "outline"
                      }
                    >
                      {teacher.role.toUpperCase()}
                    </Badge>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono">{teacher.phone}</span>
                        </div>
                      )}
                      {teacher.zalo_id && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>Zalo: {teacher.zalo_id}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Specializations */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {teacher.specializations.slice(0, 2).map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                      {teacher.specializations.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-slate-100 text-slate-500 rounded">
                          +{teacher.specializations.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <Badge variant={teacher.is_active ? "success" : "outline"}>
                      {teacher.is_active ? "Active" : "Inactive"}
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
              {Math.min(page * perPage, data.total)} of {data.total} teachers
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
