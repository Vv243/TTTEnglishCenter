"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { statsAPI } from "@/lib/api";
import type { StatsSummary, DashboardStats } from "@/types";
import { Users, GraduationCap, BookOpen, UserCircle } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, dashboardData] = await Promise.all([
          statsAPI.getSummary(),
          statsAPI.getDashboard(),
        ]);
        setSummary(summaryData.data);
        setDashboard(dashboardData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Teachers",
      value: summary?.active_teachers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Students",
      value: summary?.active_students || 0,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Classes",
      value: summary?.active_classes || 0,
      icon: BookOpen,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Active Enrollments",
      value: summary?.active_enrollments || 0,
      icon: UserCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-600">
          Monitor your English center's performance and key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="animate-fade-in border-none shadow-lg hover:shadow-xl transition-shadow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 font-mono">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Clusters */}
        <Card className="animate-fade-in animate-delay-400">
          <CardHeader>
            <CardTitle>Payment Clusters</CardTitle>
            <CardDescription>Student payment behavior distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.payment_cluster_distribution &&
                Object.entries(dashboard.payment_cluster_distribution).map(
                  ([cluster, count]) => (
                    <div key={cluster} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-sm font-medium capitalize text-slate-700">
                          {cluster.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-slate-900">
                        {count}
                      </span>
                    </div>
                  )
                )}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Status */}
        <Card className="animate-fade-in animate-delay-400">
          <CardHeader>
            <CardTitle>Enrollment Status</CardTitle>
            <CardDescription>Current enrollment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.enrollment_status_distribution &&
                Object.entries(dashboard.enrollment_status_distribution).map(
                  ([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            status === "active"
                              ? "bg-green-500"
                              : status === "completed"
                              ? "bg-blue-500"
                              : status === "dropped"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="text-sm font-medium capitalize text-slate-700">
                          {status}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-slate-900">
                        {count}
                      </span>
                    </div>
                  )
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Classes */}
      <Card className="animate-fade-in animate-delay-400">
        <CardHeader>
          <CardTitle>Teacher Workload</CardTitle>
          <CardDescription>Classes per teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard?.teacher_class_count?.map((teacher) => (
              <div
                key={teacher.teacher_name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">
                  {teacher.teacher_name}
                </span>
                <span className="text-sm font-mono font-semibold text-slate-900">
                  {teacher.class_count} {teacher.class_count === 1 ? "class" : "classes"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
