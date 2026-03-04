"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';
import { authStorage, AuthUser } from '@/lib/auth';
import { useState, useEffect } from 'react';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    router.push('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() ?? 'A';

  const displayName = user?.full_name || user?.username || 'Admin User';
  const displayRole = user?.role === 'admin' ? 'System Administrator' : 'Teacher';

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, classes, teachers..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500">{displayRole}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}