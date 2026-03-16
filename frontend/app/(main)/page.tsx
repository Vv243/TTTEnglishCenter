"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statsAPI } from "@/lib/api";
import { authStorage, AuthUser } from "@/lib/auth";
import api from "@/lib/api";
import type { StatsSummary, DashboardStats } from "@/types";
import {
  Users, GraduationCap, BookOpen, UserCircle,
  ClipboardList, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";

interface TodayClass {
  class_id: string;
  class_name: string;
  class_code: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  level: string;
  enrolled_count: number;
  attendance_recorded: boolean;
  is_cancelled: boolean;
  session_date: string;
  teacher_name?: string;
}

const formatTime = (t: string) => t.slice(0, 5);

const formatDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = authStorage.getUser();
    setUser(u);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, dashboardData, todayData] = await Promise.all([
          statsAPI.getSummary(),
          statsAPI.getDashboard(),
          api.get("/attendance/today/").then(r => r.data),
        ]);
        setSummary(summaryData);
        setDashboard(dashboardData);
        setTodayClasses(todayData);
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

  const isAdmin = user?.role === "admin";
  const displayName = user?.full_name || user?.username || "there";
  const today = new Date().toISOString().split("T")[0];

  const stats = [
    { title: "Active Teachers",    value: summary?.active_teachers || 0,    icon: Users,        color: "text-blue-600",   bgColor: "bg-blue-50"   },
    { title: "Active Students",    value: summary?.active_students || 0,    icon: GraduationCap,color: "text-green-600",  bgColor: "bg-green-50"  },
    { title: "Active Classes",     value: summary?.active_classes || 0,     icon: BookOpen,     color: "text-amber-600",  bgColor: "bg-amber-50"  },
    { title: "Active Enrollments", value: summary?.active_enrollments || 0, icon: UserCircle,   color: "text-purple-600", bgColor: "bg-purple-50" },
  ];

  const recordedCount = todayClasses.filter(c => c.attendance_recorded).length;
  const cancelledCount = todayClasses.filter(c => c.is_cancelled).length;
  const pendingCount = todayClasses.filter(c => !c.attendance_recorded && !c.is_cancelled).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {getGreeting()}{user ? (isAdmin ? ", Admin" : `, ${displayName}`) : ""}! 👋
          </h1>
          <p className="text-slate-500">{formatDate()}</p>
        </div>
        {isAdmin && (
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Admin View</p>
            <p className="text-sm text-slate-600">All teachers · All classes</p>
          </div>
        )}
      </div>

      {/* TODAY'S CLASSES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isAdmin ? "All Classes Today" : "Your Classes Today"}
            </h2>
            {todayClasses.length > 0 && (
              <p className="text-sm text-slate-500 mt-0.5">
                {pendingCount > 0 && <span className="text-amber-600 font-medium">{pendingCount} pending attendance</span>}
                {pendingCount > 0 && recordedCount > 0 && " · "}
                {recordedCount > 0 && <span className="text-green-600">{recordedCount} recorded</span>}
                {cancelledCount > 0 && <span className="text-red-500"> · {cancelledCount} cancelled</span>}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/attendance")}
            className="gap-2 text-slate-600"
          >
            <ClipboardList className="h-4 w-4" />
            View Attendance
          </Button>
        </div>

        {todayClasses.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500 font-medium">No classes scheduled for today</p>
            <p className="text-slate-400 text-sm mt-1">Enjoy your day off!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayClasses.map((cls, index) => (
              <Card
                key={cls.class_id}
                className={`overflow-hidden animate-fade-in transition-all hover:shadow-md ${cls.is_cancelled ? "opacity-60" : ""}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Time */}
                      <div className="text-center bg-slate-50 rounded-xl px-3 py-2 min-w-[62px] flex-shrink-0">
                        <p className="text-base font-bold font-mono text-slate-900">{formatTime(cls.start_time)}</p>
                        <p className="text-xs text-slate-400">{formatTime(cls.end_time)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{cls.class_name}</p>
                        <p className="text-xs font-mono text-slate-400">{cls.class_code}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          {cls.room_number && <span>📍 {cls.room_number}</span>}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {cls.enrolled_count}
                          </span>
                          {isAdmin && cls.teacher_name && (
                            <span className="text-blue-500 font-medium">{cls.teacher_name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      {cls.is_cancelled ? (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full font-medium">Cancelled</span>
                      ) : cls.attendance_recorded ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Done
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-600 rounded-full font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {!cls.is_cancelled && (
                    <div className="mt-4">
                      <Button
                        onClick={() => router.push(`/attendance?class_id=${cls.class_id}&date=${today}`)}
                        className={`w-full gap-2 text-sm ${cls.attendance_recorded ? "bg-slate-700 hover:bg-slate-800" : "bg-amber-500 hover:bg-amber-600"} text-white`}
                      >
                        <ClipboardList className="h-4 w-4" />
                        {cls.attendance_recorded ? "Edit Attendance" : "Take Attendance"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Overview</h2>
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
                      <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 font-mono">{stat.value}</p>
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
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Clusters */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Payment Clusters</CardTitle>
            <CardDescription>Student payment behavior distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.students?.payment_clusters &&
                Object.entries(dashboard.students.payment_clusters).map(([cluster, count]) => (
                  <div key={cluster} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium capitalize text-slate-700">
                        {cluster.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-slate-900">{count as number}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Teacher Workload */}
        <Card className="animate-fade-in">
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
                  <span className="text-sm font-medium text-slate-700">{teacher.teacher_name}</span>
                  <span className="text-sm font-mono font-semibold text-slate-900">
                    {teacher.class_count} {teacher.class_count === 1 ? "class" : "classes"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}