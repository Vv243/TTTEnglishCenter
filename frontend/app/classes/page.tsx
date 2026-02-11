"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classesAPI } from "@/lib/api";
import type { Class, PaginatedResponse } from "@/types";
import { ChevronLeft, ChevronRight, Clock, Calendar, Users } from "lucide-react";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ClassesPage() {
  const [data, setData] = useState<PaginatedResponse<Class> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const result = await classesAPI.getAll({
          page,
          per_page: perPage,
        });
        setData(result);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "scheduled":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatLevel = (level: string) => {
    return level.replace(/_/g, " ").toUpperCase();
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading classes...</div>
      </div>
    );
  }

  const classes = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Classes</h1>
          <p className="text-slate-600">
            Manage class schedules and enrollments
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          + Create Class
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.map((classItem, index) => (
          <Card
            key={classItem.id}
            className="p-6 hover:shadow-lg transition-all animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {classItem.class_name}
                </h3>
                <p className="text-sm font-mono text-slate-500">
                  {classItem.class_code}
                </p>
              </div>
              <Badge variant={getStatusColor(classItem.status)}>
                {classItem.status.toUpperCase()}
              </Badge>
            </div>

            {/* Level */}
            <div className="mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-amber-50 text-amber-700 rounded-full">
                {formatLevel(classItem.level)}
              </span>
            </div>

            {/* Schedule */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {daysOfWeek[classItem.day_of_week]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {formatTime(classItem.start_time)} -{" "}
                  {formatTime(classItem.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>
                  <span className="font-semibold text-slate-900">
                    {classItem.current_enrollment}
                  </span>
                  {" / "}
                  {classItem.max_students} students
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                  style={{
                    width: `${
                      (classItem.current_enrollment / classItem.max_students) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Tuition per session</p>
                <p className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(classItem.tuition_per_session)}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    {classItem.currency}
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * perPage + 1} to{" "}
              {Math.min(page * perPage, data.total)} of {data.total} classes
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
        </Card>
      )}
    </div>
  );
}
