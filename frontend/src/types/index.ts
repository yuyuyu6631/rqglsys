export interface User {
    id: number;
    username: string;
    role: 'admin' | 'station' | 'delivery' | 'user';
    phone?: string;
    real_name?: string;
    station_id?: number;
    created_at?: string;
}

export interface Cylinder {
    id: number;
    serial_code: string;
    specs: string;
    status: 'in_stock' | 'delivering' | 'in_use' | 'empty';
    manufacturer?: string;
    manufacture_date?: string;
    expiry_date?: string;
    last_check_date?: string;
    station_id?: number;
    created_at?: string;
}

export interface Order {
    id: number;
    order_no: string;
    user_id: number;
    user_name?: string;
    delivery_id?: number;
    delivery_name?: string;
    status: 'pending' | 'assigned' | 'delivering' | 'completed' | 'cancelled';
    specs: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    address: string;
    contact_name: string;
    contact_phone: string;
    remark?: string;
    created_at?: string;
    assigned_at?: string;
    completed_at?: string;
}

export interface SafetyRecord {
    id: number;
    order_id?: number;
    order_no?: string;
    inspector_id: number;
    inspector_name?: string;
    check_items?: string;
    hazard_level: 'none' | 'low' | 'medium' | 'high';
    hazard_description?: string;
    photos?: string[];
    rectify_status?: string;
    rectify_photos?: string[];
    created_at?: string;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    author_id?: number;
    author_name?: string;
    is_top: boolean;
    created_at?: string;
}

export interface DashboardStats {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    total_cylinders: number;
    in_stock: number;
    total_users: number;
    total_delivery: number;
    today_orders: number;
    today_revenue: number;
}

export interface OrderTrend {
    date: string;
    count: number;
}

export interface DeliveryRanking {
    id: number;
    username: string;
    real_name: string;
    order_count: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}
