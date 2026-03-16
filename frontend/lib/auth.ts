import Cookies from 'js-cookie'

const TOKEN_KEY = 'ttt_token'
const USER_KEY = 'ttt_user'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'teacher'
  full_name?: string | null
  is_active: boolean
  teacher_id: string | null
}

export const authStorage = {
  setToken: (token: string) => Cookies.set(TOKEN_KEY, token, { expires: 1 }),
  getToken: () => Cookies.get(TOKEN_KEY),
  setUser: (user: AuthUser) => Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1 }),
  getUser: (): AuthUser | null => {
    const u = Cookies.get(USER_KEY)
    return u ? JSON.parse(u) : null
  },
  clear: () => {
    Cookies.remove(TOKEN_KEY)
    Cookies.remove(USER_KEY)
  },
  isAuthenticated: () => !!Cookies.get(TOKEN_KEY),
}

export async function loginRequest(username: string, password: string) {
  const res = await fetch(
    `${API_URL}/api/v1/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    { method: 'POST' }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function refreshToken(): Promise<boolean> {
  const token = authStorage.getToken()
  if (!token) return false
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return false
    const data = await res.json()
    authStorage.setToken(data.access_token)
    authStorage.setUser(data.user)
    return true
  } catch {
    return false
  }
}