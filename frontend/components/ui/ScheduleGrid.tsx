"use client";

import { useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
export interface GridClass {
  class_id: string;
  class_name: string;
  class_code: string;
  teacher_id: string;
  teacher_name: string;
  days_of_week: number[];
  start_time: string; // "HH:MM"
  end_time: string;
  room_number: string | null;
  level: string;
  status: string;
  is_own: boolean;
  current_enrollment: number;
  max_students: number;
}

interface Props {
  classes: GridClass[];
  currentTeacherId?: string;
  isAdmin: boolean;
  onClassClick: (cls: GridClass) => void;
  onSlotClick: (day: number, time: string) => void;
}

// ── Constants ─────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Time slots from 07:00 to 22:00 in 30-min increments
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:30`);
}

const TEACHER_COLORS = [
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800", dot: "bg-amber-400" },
  { bg: "bg-blue-100",  border: "border-blue-400",  text: "text-blue-800",  dot: "bg-blue-400"  },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-800", dot: "bg-green-400" },
  { bg: "bg-purple-100",border: "border-purple-400",text: "text-purple-800",dot: "bg-purple-400"},
  { bg: "bg-rose-100",  border: "border-rose-400",  text: "text-rose-800",  dot: "bg-rose-400"  },
];

const parseMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const SLOT_HEIGHT = 32; // px per 30-min slot
const GRID_START = parseMinutes("07:00");

// ── Schedule Grid ─────────────────────────────────────────────
export default function ScheduleGrid({ classes, currentTeacherId, isAdmin, onClassClick, onSlotClick }: Props) {
  // Assign colors to teachers
  const teacherColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    let idx = 0;
    classes.forEach(cls => {
      if (!(cls.teacher_id in map)) {
        map[cls.teacher_id] = idx % TEACHER_COLORS.length;
        idx++;
      }
    });
    return map;
  }, [classes]);

  // Group classes by day
  const classesByDay = useMemo(() => {
    const map: Record<number, GridClass[]> = {};
    for (let d = 0; d < 7; d++) map[d] = [];
    classes.forEach(cls => {
      cls.days_of_week.forEach(d => {
        // Convert stored format: 0=Sun,1=Mon... to grid format: 0=Mon,1=Tue...
        const gridDay = d === 0 ? 6 : d - 1;
        map[gridDay].push(cls);
      });
    });
    return map;
  }, [classes]);

  const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT;

  return (
    <div className="overflow-x-auto">
      {/* Teacher legend */}
      <div className="flex flex-wrap gap-3 mb-4 px-1">
        {Object.entries(teacherColorMap).map(([tid, colorIdx]) => {
          const cls = classes.find(c => c.teacher_id === tid);
          if (!cls) return null;
          const color = TEACHER_COLORS[colorIdx];
          const isYou = tid === currentTeacherId;
          return (
            <div key={tid} className="flex items-center gap-1.5 text-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
              <span className={`text-slate-700 ${isYou ? "font-bold" : ""}`}>
                {cls.teacher_name}{isYou ? " (You)" : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex border border-slate-200 rounded-xl overflow-hidden">
        {/* Time column */}
        <div className="flex-shrink-0 w-20 bg-slate-50 border-r border-slate-200">
          <div className="h-10 border-b border-slate-200" /> {/* header spacer */}
          <div className="relative" style={{ height: totalHeight }}>
            {TIME_SLOTS.map((slot, i) => {
              if (!slot.endsWith(":00")) return null;
              return (
                <div
                  key={slot}
                  className="absolute w-full text-right pr-2 text-sm text-slate-500 font-mono font-medium"
                  style={{ top: i * SLOT_HEIGHT - 6 }}
                >
                  {slot}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex flex-1 min-w-0">
          {DAYS.map((day, dayIdx) => {
            const dayClasses = classesByDay[dayIdx] || [];
            return (
              <div key={day} className="flex-1 min-w-[120px] border-r border-slate-200 last:border-r-0">
                {/* Day header */}
                <div className="h-10 flex items-center justify-center bg-slate-50 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">{day}</span>
                </div>

                {/* Time grid */}
                <div
                  className="relative cursor-pointer"
                  style={{ height: totalHeight }}
                  onClick={(e) => {
                    // Calculate clicked time from Y position
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const slotIdx = Math.floor(y / SLOT_HEIGHT);
                    const clickedSlot = TIME_SLOTS[Math.min(slotIdx, TIME_SLOTS.length - 1)];
                    onSlotClick(dayIdx, clickedSlot);
                  }}
                >
                  {/* Grid lines */}
                  {TIME_SLOTS.map((slot, i) => (
                    <div
                      key={slot}
                      className={`absolute w-full border-t ${slot.endsWith(":00") ? "border-slate-200" : "border-slate-100"}`}
                      style={{ top: i * SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 hover:bg-amber-50/30 transition-colors" />

                  {/* Class blocks */}
                  {dayClasses.map((cls) => {
                    const startMin = parseMinutes(cls.start_time);
                    const endMin   = parseMinutes(cls.end_time);
                    const top      = ((startMin - GRID_START) / 30) * SLOT_HEIGHT;
                    const height   = ((endMin - startMin) / 30) * SLOT_HEIGHT;

                    const colorIdx = teacherColorMap[cls.teacher_id] ?? 0;
                    const color    = TEACHER_COLORS[colorIdx];
                    const isOwn    = cls.is_own;
                    const isFull   = cls.current_enrollment >= cls.max_students;

                    return (
                      <div
                        key={cls.class_id}
                        className={`absolute left-1 right-1 rounded-lg border-l-4 px-1.5 py-1 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] z-10
                          ${color.bg} ${color.border} ${!isOwn && !isAdmin ? "opacity-60" : ""}`}
                        style={{ top: top + 2, height: height - 4 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClassClick(cls);
                        }}
                      >
                        <p className={`text-[12px] font-bold leading-tight truncate ${color.text}`}>
                          {cls.class_name}
                        </p>
                        {height > 40 && (
                          <>
                            {cls.room_number && (
                              <p className="text-[11px] text-slate-500 truncate">📍 {cls.room_number}</p>
                            )}
                            {isAdmin && (
                              <p className="text-[11px] text-slate-400 truncate">{cls.teacher_name}</p>
                            )}
                            <p className={`text-[11px] ${isFull ? "text-red-500" : "text-slate-400"}`}>
                              {cls.current_enrollment}/{cls.max_students}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}