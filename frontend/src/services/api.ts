import axios from 'axios';
import type {
    User, Cylinder, Order, SafetyRecord, Announcement,
    DashboardStats, OrderTrend, DeliveryRanking
} from '../types/index';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get<User>('/auth/me'),
};

export const userApi = {
    getUsers: (role?: string) => api.get<User[]>('/users', { params: { role } }),
    createUser: (data: Partial<User>) => api.post<User>('/users', data),
    updateUser: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
    deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const cylinderApi = {
    getCylinders: (params?: any) => api.get<Cylinder[]>('/cylinders', { params }),
    createCylinder: (data: Partial<Cylinder>) => api.post<Cylinder>('/cylinders', data),
    updateCylinder: (id: number, data: Partial<Cylinder>) => api.put<Cylinder>(`/cylinders/${id}`, data),
    updateStatus: (id: number, status: string) => api.put<Cylinder>(`/cylinders/${id}/status`, { status }),
    deleteCylinder: (id: number) => api.delete(`/cylinders/${id}`),
    getStats: () => api.get('/cylinders/stats'),
};

export const orderApi = {
    getOrders: (status?: string) => api.get<Order[]>('/orders', { params: { status } }),
    createOrder: (data: any) => api.post<Order>('/orders', data),
    assignOrder: (id: number, delivery_id: number) => api.put<Order>(`/orders/${id}/assign`, { delivery_id }),
    updateStatus: (id: number, status: string) => api.put<Order>(`/orders/${id}/status`, { status }),
};

export const safetyApi = {
    getRecords: (params?: any) => api.get<SafetyRecord[]>('/safety/records', { params }),
    createRecord: (data: any) => api.post<SafetyRecord>('/safety/records', data),
    uploadPhoto: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/safety/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const statsApi = {
    getDashboard: () => api.get<DashboardStats>('/stats/dashboard'),
    getOrderTrend: (days: number = 7) => api.get<OrderTrend[]>('/stats/orders/trend', { params: { days } }),
    getDeliveryRanking: () => api.get<DeliveryRanking[]>('/stats/delivery/ranking'),
};

export const announcementApi = {
    getAnnouncements: () => api.get<Announcement[]>('/announcements'),
    createAnnouncement: (data: any) => api.post<Announcement>('/announcements', data),
    deleteAnnouncement: (id: number) => api.delete(`/announcements/${id}`),
};

export default api;
