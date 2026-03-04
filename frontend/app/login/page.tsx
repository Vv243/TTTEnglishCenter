'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authStorage, loginRequest } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const data = await loginRequest(username, password)
      authStorage.setToken(data.access_token)
      authStorage.setUser(data.user)
      const from = searchParams.get('from') || '/'
      router.push(from)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white">TTT English Center</h1>
          <p className="text-slate-400 mt-1">Trung tâm Anh ngữ · Management System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to continue</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="admin"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {/* Hint */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Default: <span className="text-slate-400 font-mono">admin</span> / <span className="text-slate-400 font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}