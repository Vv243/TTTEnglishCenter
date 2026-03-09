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
  { name: "Dashboard",   href: "/",           icon: LayoutDashboard },
  { name: "Teachers",    href: "/teachers",    icon: Users           },
  { name: "Students",    href: "/students",    icon: GraduationCap   },
  { name: "Classes",     href: "/classes",     icon: BookOpen        },
  { name: "Enrollments", href: "/enrollments", icon: UserCircle      },
  { name: "ML Insights", href: "/ml",          icon: Brain           },
  { name: "Payments",    href: "/payments",    icon: Banknote        },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">

      {/* ── Brand ── */}
      <div className="flex h-20 items-center justify-center border-b border-slate-700/50 px-6">
        <div className="flex flex-col">
          {/* "TTT English Center" label — Epilogue, safe for Vietnamese */}
          <p className="font-epilogue text-[10px] font-700 uppercase tracking-[0.14em] text-amber-400 mb-1">
            TTT English Center
          </p>
          {/* "EduCore" — Fraunces italic, display text only */}
          <h1 className="font-display text-[26px] leading-none text-white">
            EduCore
          </h1>
          {/* Vietnamese subtitle — Epilogue, renders diacritics cleanly */}
          <p className="font-epilogue text-[11px] font-normal text-slate-400 mt-1 tracking-wide">
            Trung tâm Tiếng Anh
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {/* Section label */}
        <p className="font-epilogue text-[9.5px] font-bold uppercase tracking-[0.15em] text-slate-500 px-3 pb-2 pt-1">
          Quản lý
        </p>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                // Epilogue for nav — handles Vietnamese if names are ever localised
                "font-epilogue group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
                isActive
                  ? "bg-amber-500/15 text-amber-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-amber-400" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-amber-400" : "text-slate-500"
                )}
              />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="rounded-lg bg-slate-700/30 p-3">
          {/* Version — Space Mono for code-like feel */}
          <p className="font-mono text-[11px] text-slate-400">EduCore v1.0</p>
          {/* Location — Epilogue for Vietnamese */}
          <p className="font-epilogue text-[11px] text-slate-500 mt-1">
            TP. Hồ Chí Minh, VN
          </p>
        </div>
      </div>

    </div>
  );
}