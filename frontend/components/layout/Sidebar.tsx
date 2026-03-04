"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserCircle,
  Brain,
  Banknote,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: Users,
  },
  {
    name: "Students",
    href: "/students",
    icon: GraduationCap,
  },
  {
    name: "Classes",
    href: "/classes",
    icon: BookOpen,
  },
  {
    name: "Enrollments",
    href: "/enrollments",
    icon: UserCircle,
  },
  {
    name: "ML Insights",
    href: "/ml",
    icon: Brain,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Banknote,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center border-b border-slate-700/50 px-6">
        <div className="flex flex-col">
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            <span className="text-amber-400">TTT</span>
            <span className="text-white">English</span>
          </h1>
          <p className="font-sans text-xs text-slate-400">
            Center Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400"
                )}
              />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="rounded-lg bg-slate-700/30 p-3 text-xs text-slate-400">
          <p className="font-mono">EduCore v1.0</p>
          <p className="mt-1 text-slate-500">
            Ho Chi Minh City, VN
          </p>
        </div>
      </div>
    </div>
  );
}