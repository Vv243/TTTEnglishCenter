"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddTeacherModal from "@/components/ui/AddTeacherModal";
import TeacherDetailModal from "@/components/ui/TeacherDetailModal";
import { teachersAPI } from "@/lib/api";
import type { Teacher } from "@/types";
import { Mail, Phone, MessageCircle, Search, X } from "lucide-react";
import { authStorage } from "@/lib/auth";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const user = authStorage.getUser();
    setIsAdmin(user?.role === "admin");
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teachersAPI.getAll({ is_active: true });
      // teachersAPI.getAll already remaps d.teachers → items
      setTeachers(response.items);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      !search ||
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const hasFilters = search || roleFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading teachers...</div>
      </div>
    );
  }

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
        {isAdmin && (
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setShowAddModal(true)}
          >
            + Add Teacher
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="assistant">Assistant</option>
        </select>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearch(""); setRoleFilter(""); }}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Active filter pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center gap-1">
              Search: "{search}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
            </span>
          )}
          {roleFilter && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center gap-1">
              Role: {roleFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter("")} />
            </span>
          )}
        </div>
      )}

      {/* Teachers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Teacher</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Specializations</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    {hasFilters ? "No teachers match your filters." : "No teachers found."}
                  </td>
                </tr>
              ) : (
                filtered.map((teacher, index) => (
                  <tr
                    key={teacher.id} onClick={() => setSelectedTeacher(teacher)} style={{cursor: "pointer"}}
                    className="hover:bg-slate-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                          {teacher.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{teacher.full_name}</p>
                          <p className="text-sm text-slate-500 font-mono">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          teacher.role === "admin" ? "destructive"
                          : teacher.role === "teacher" ? "default"
                          : "outline"
                        }
                      >
                        {teacher.role.toUpperCase()}
                      </Badge>
                    </td>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.specializations.slice(0, 2).map((spec) => (
                          <span key={spec} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
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
                    <td className="px-6 py-4">
                      <Badge variant={teacher.is_active ? "default" : "outline"}>
                        {teacher.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-sm text-slate-500">
          Showing {filtered.length} of {teachers.length} teachers
        </div>
      </Card>

      {/* Teacher Detail Modal */}
      <TeacherDetailModal
        teacher={selectedTeacher}
        isOpen={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        isAdmin={isAdmin}
      />
      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTeachers}
      />
    </div>
  );
}