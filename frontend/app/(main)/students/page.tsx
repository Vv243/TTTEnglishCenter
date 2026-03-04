"use client";

import AddStudentModal from "@/components/ui/AddStudentModal";
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { studentsAPI } from "@/lib/api";
import type { Student, PaginatedResponse } from "@/types";
import { ChevronLeft, ChevronRight, MapPin, Phone, Users, Search, X } from "lucide-react";

// ---------- Filter State ----------
interface Filters {
  search: string;
  grade_level: string;
  payment_cluster: string;
  province_city: string;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  grade_level: "",
  payment_cluster: "",
  province_city: "",
};

const GRADE_LEVELS = [
  { value: "", label: "All Grades" },
  { value: "primary_1", label: "Primary 1" },
  { value: "primary_2", label: "Primary 2" },
  { value: "primary_3", label: "Primary 3" },
  { value: "primary_4", label: "Primary 4" },
  { value: "primary_5", label: "Primary 5" },
  { value: "secondary_6", label: "Secondary 6" },
  { value: "secondary_7", label: "Secondary 7" },
  { value: "secondary_8", label: "Secondary 8" },
  { value: "secondary_9", label: "Secondary 9" },
  { value: "high_10", label: "High 10" },
  { value: "high_11", label: "High 11" },
  { value: "high_12", label: "High 12" },
];

const PAYMENT_CLUSTERS = [
  { value: "", label: "All Clusters" },
  { value: "always_on_time", label: "Always On Time" },
  { value: "new_student", label: "New Student" },
  { value: "needs_reminder", label: "Needs Reminder" },
  { value: "high_risk", label: "High Risk" },
  { value: "erratic", label: "Erratic" },
];

const VIETNAM_PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Bình Định", "Cao Bằng", "Cà Mau", "Đắk Lắk",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên",
  "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An",
  "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sơn La", "Tây Ninh", "Thanh Hóa", "Thái Nguyên", "Vĩnh Long",
];

// ---------- Helpers ----------
const getPaymentClusterColor = (cluster: string) => {
  switch (cluster) {
    case "always_on_time": return "success";
    case "new_student":    return "default";
    case "needs_reminder": return "warning";
    case "high_risk":      return "destructive";
    case "erratic":        return "outline";
    default:               return "outline";
  }
};

const formatGradeLevel = (level: string | null) => {
  if (!level) return "-";
  return level.replace("_", " ").toUpperCase();
};

const formatAddress = (student: Student) => {
  const parts = [student.ward, student.province_city].filter(Boolean);
  return parts.length > 0 ? parts : null;
};

// ---------- Component ----------
export default function StudentsPage() {
  const [data, setData] = useState<PaginatedResponse<Student> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const perPage = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: perPage,
        is_active: true,
      };

      if (filters.grade_level)     params.grade_level     = filters.grade_level;
      if (filters.payment_cluster) params.payment_cluster = filters.payment_cluster;
      if (filters.province_city)   params.province_city   = filters.province_city;

      const result = await studentsAPI.getAll(params);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters.grade_level, filters.payment_cluster, filters.province_city]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Client-side name search
  const students = (data?.items || []).filter((s) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.parent_name.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters =
    filters.search || filters.grade_level || filters.payment_cluster || filters.province_city;

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    setPage(1);
  };

  const handleFilterChange = (key: keyof Omit<Filters, "search">, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Students</h1>
          <p className="text-slate-600">
            {data ? `${data.total} students total` : "Manage student enrollments and information"}
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setShowAddModal(true)}
        >
          + Add Student
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or parent name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Grade Level */}
          <select
            value={filters.grade_level}
            onChange={(e) => handleFilterChange("grade_level", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700"
          >
            {GRADE_LEVELS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          {/* Payment Cluster */}
          <select
            value={filters.payment_cluster}
            onChange={(e) => handleFilterChange("payment_cluster", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700"
          >
            {PAYMENT_CLUSTERS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Province/City filter */}
          <select
            value={filters.province_city}
            onChange={(e) => handleFilterChange("province_city", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700"
          >
            <option value="">All Provinces</option>
            {VIETNAM_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Clear */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Filters:</span>
            {filters.search && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                Name: "{filters.search}"
              </span>
            )}
            {filters.grade_level && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                Grade: {formatGradeLevel(filters.grade_level)}
              </span>
            )}
            {filters.payment_cluster && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                Cluster: {filters.payment_cluster.replace(/_/g, " ")}
              </span>
            )}
            {filters.province_city && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Province: {filters.province_city}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-slate-500">Loading students...</div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No students match your filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-xs text-amber-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, index) => {
                  const address = formatAddress(student);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.full_name}</p>
                            <p className="text-xs text-slate-500">
                              Enrolled:{" "}
                              {new Date(student.enrollment_date).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Grade */}
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
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {address ? (
                            <div>
                              {student.ward && (
                                <p className="font-medium">{student.ward}</p>
                              )}
                              {student.province_city && (
                                <p className="text-xs text-slate-500">{student.province_city}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No address</span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
}