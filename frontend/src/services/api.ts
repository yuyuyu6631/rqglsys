import axios from 'axios';
import type { AxiosError } from 'axios';
import type {
    Announcement,
    Cylinder,
    CylinderSpecStat,
    DashboardStats,
    DeliveryRanking,
    Order,
    OrderTrend,
    Rating,
    SafetyRecord,
    UploadPhotoResponse,
    User,
} from '../types/index';

type UserPayload = Partial<User> & { password?: string };

export interface CylinderParams {
    status?: string;
    specs?: string;
}

export interface CreateOrderData {
    specs: string;
    quantity: number;
    address: string;
    contact_name: string;
    contact_phone: string;
    remark?: string;
}

export interface SafetyRecordParams {
    hazard_level?: string;
}

export interface AnnouncementData {
    title: string;
    content: string;
    is_top?: boolean;
}

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: string; message?: string }>) => {
        const requestUrl = error.config?.url || '';
        const status = error.response?.status;
        const isAuthProbe = requestUrl.includes('/auth/me');
        const isLoginRequest = requestUrl.includes('/auth/login');

        if (status === 401 && !isAuthProbe && !isLoginRequest && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }

        return Promise.reject(error);
    },
);

export const authApi = {
    login: (username: string, password: string) =>
        api.post<{ message: string; user: User }>('/auth/login', { username, password }),
    logout: () => api.post<{ message: string }>('/auth/logout'),
    getCurrentUser: () => api.get<User>('/auth/me'),
};

export const userApi = {
    getUsers: (role?: string) => api.get<User[]>('/users', { params: { role } }),
    getUser: (id: number) => api.get<User>(`/users/${id}`),
    createUser: (data: UserPayload) => api.post<User>('/users', data),
    updateUser: (id: number, data: UserPayload) => api.put<User>(`/users/${id}`, data),
    deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const cylinderApi = {
    getCylinders: (params?: CylinderParams) => api.get<Cylinder[]>('/cylinders', { params }),
    getCylinder: (id: number) => api.get<Cylinder>(`/cylinders/${id}`),
    createCylinder: (data: Partial<Cylinder>) => api.post<Cylinder>('/cylinders', data),
    updateCylinder: (id: number, data: Partial<Cylinder>) => api.put<Cylinder>(`/cylinders/${id}`, data),
    updateStatus: (id: number, status: string) => api.put<Cylinder>(`/cylinders/${id}/status`, { status }),
    deleteCylinder: (id: number) => api.delete(`/cylinders/${id}`),
    getStats: () => api.get('/cylinders/stats'),
};

export const orderApi = {
    getOrders: (status?: string) => api.get<Order[]>('/orders', { params: { status } }),
    getOrder: (id: number) => api.get<Order>(`/orders/${id}`),
    createOrder: (data: CreateOrderData) => api.post<Order>('/orders', data),
    assignOrder: (id: number, delivery_id: number) => api.put<Order>(`/orders/${id}/assign`, { delivery_id }),
    updateStatus: (id: number, status: string) => api.put<Order>(`/orders/${id}/status`, { status }),
};

export const safetyApi = {
    getRecords: (params?: SafetyRecordParams) => api.get<SafetyRecord[]>('/safety/records', { params }),
    getRecord: (id: number) => api.get<SafetyRecord>(`/safety/records/${id}`),
    createRecord: (data: Partial<SafetyRecord> & { order_id?: number }) => api.post<SafetyRecord>('/safety/records', data),
    updateRecord: (id: number, data: Partial<SafetyRecord>) => api.put<SafetyRecord>(`/safety/records/${id}`, data),
    deleteRecord: (id: number) => api.delete(`/safety/records/${id}`),
    uploadPhoto: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<UploadPhotoResponse>('/safety/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const statsApi = {
    getDashboard: () => api.get<DashboardStats>('/stats/dashboard'),
    getOrderTrend: (days: number = 7) => api.get<OrderTrend[]>('/stats/orders/trend', { params: { days } }),
    getDeliveryRanking: () => api.get<DeliveryRanking[]>('/stats/delivery/ranking'),
    getCylinderSpecs: () => api.get<CylinderSpecStat[]>('/stats/cylinders/specs'),
};

export const announcementApi = {
    getAnnouncements: () => api.get<Announcement[]>('/announcements'),
    getAnnouncement: (id: number) => api.get<Announcement>(`/announcements/${id}`),
    createAnnouncement: (data: AnnouncementData) => api.post<Announcement>('/announcements', data),
    updateAnnouncement: (id: number, data: Partial<AnnouncementData>) => api.put<Announcement>(`/announcements/${id}`, data),
    deleteAnnouncement: (id: number) => api.delete(`/announcements/${id}`),
};

export const ratingApi = {
    createRating: (data: { order_id: number; score: number; comment?: string }) => api.post<Rating>('/ratings', data),
    getOrderRating: (id: number) => api.get<Rating>(`/orders/${id}/rating`),
};

export default api;
