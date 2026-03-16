import axios from "axios";
import type {
  Teacher,
  Student,
  Class,
  Enrollment,
  StatsSummary,
  DashboardStats,
  PaginatedResponse,
} from "@/types";
import Cookies from 'js-cookie'
import { authStorage, refreshToken } from '@/lib/auth'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Teachers API
export const teachersAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    is_active?: boolean;
    role?: string;
  }): Promise<PaginatedResponse<Teacher>> => {
    const response = await api.get("/teachers/", { params });
    const d = response.data;
    return {
      items: d.teachers ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      per_page: d.page_size ?? 10,
      pages: Math.ceil((d.total ?? 0) / (d.page_size ?? 10)),
    };
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await api.get(`/teachers/${id}/`);
    return response.data;
  },
};

// Students API
export const studentsAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    grade_level?: string;
    target_exam?: string;
    payment_cluster?: string;
    province_city?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await api.get("/students/", { params });
    const d = response.data;
    return {
      items: d.students ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      per_page: d.page_size ?? 10,
      pages: Math.ceil((d.total ?? 0) / (d.page_size ?? 10)),
    };
  },

  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Student>): Promise<Student> => {
    const response = await api.post("/students/", data);
    return response.data;
  },

  // FIXED: added trailing slash
  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const response = await api.patch(`/students/${id}/`, data);
    return response.data;
  },

  // FIXED: added trailing slash
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },
};

// Classes API
export const classesAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    level?: string;
    semester?: string;
    teacher_id?: string;
    day_of_week?: number;
  }): Promise<PaginatedResponse<Class>> => {
    const response = await api.get("/classes/", { params });
    const d = response.data;
    return {
      items: d.classes ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      per_page: d.page_size ?? 10,
      pages: Math.ceil((d.total ?? 0) / (d.page_size ?? 10)),
    };
  },

  getById: async (id: string): Promise<Class> => {
    const response = await api.get(`/classes/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Class>): Promise<Class> => {
    const response = await api.post("/classes/", data);
    return response.data;
  },

  // FIXED: added trailing slash
  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    const response = await api.patch(`/classes/${id}/`, data);
    return response.data;
  },

  // FIXED: added trailing slash
  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}/`);
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    student_id?: string;
    class_id?: string;
  }): Promise<PaginatedResponse<Enrollment>> => {
    const response = await api.get("/enrollments/", { params });
    const d = response.data;
    return {
      items: d.enrollments ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      per_page: d.page_size ?? 10,
      pages: Math.ceil((d.total ?? 0) / (d.page_size ?? 10)),
    };
  },

  getById: async (id: string): Promise<Enrollment> => {
    const response = await api.get(`/enrollments/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Enrollment>): Promise<Enrollment> => {
    const response = await api.post("/enrollments/", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Enrollment>): Promise<Enrollment> => {
    const response = await api.patch(`/enrollments/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/enrollments/${id}/`);
  },
};

// Statistics API
export const statsAPI = {
  getSummary: async (): Promise<StatsSummary> => {
    const response = await api.get("/stats/summary/");
    return response.data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get("/stats/dashboard/");
    return response.data;
  },
};

// Auth interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('ttt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshed = await refreshToken()
      if (refreshed) {
        const newToken = Cookies.get('ttt_token')
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } else {
        authStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ML API
export const mlAPI = {
  getSchedule: async (): Promise<any> => {
    const response = await api.post("/ml/schedule/")
    return response.data
  }
}

export default api;

