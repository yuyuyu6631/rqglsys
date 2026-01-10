import { useState, useEffect } from 'react';
import {
    CheckCircle2, Navigation, Phone,
    MapPin, ClipboardCheck, Clock
} from 'lucide-react';
import { orderApi } from '../services/api';
import type { Order } from '../types/index';

export default function DeliveryOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderApi.getOrders();
            setOrders(res.data.filter(o => ['assigned', 'delivering'].includes(o.status)));
        } catch (err) {
            console.error('获取任务失败', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await orderApi.updateStatus(id, status);
            fetchOrders();
        } catch (err) {
            alert('状态更新失败');
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">我的配送任务</h2>
                    <p className="text-sm text-gray-400 mt-1">今日尚有 {orders.length} 个任务待处理</p>
                </div>
                <button onClick={fetchOrders} className="btn btn-ghost rounded-full border-gray-800">
                    <Clock size={18} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="loading-spinner"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="card text-center py-20 bg-emerald-500/5 border-emerald-500/10">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg text-emerald-400 font-medium">任务已全部完成！</h3>
                    <p className="text-gray-500 mt-2">休息一下，等待新的派单</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="card p-0 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`badge mb-3 ${order.status === 'assigned' ? 'badge-info' : 'badge-warning'}`}>
                                            {order.status === 'assigned' ? '待接单' : '配送中'}
                                        </span>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            {order.specs} 燃气 × {order.quantity}
                                        </h3>
                                        <p className="text-xs font-mono text-gray-500 mt-1">订单 ID: {order.order_no}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-400">¥{order.total_amount}</div>
                                        <div className="text-xs text-gray-500 mt-1">货到付款</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-gray-500 shrink-0 mt-0.5" size={16} />
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{order.address}</div>
                                                <div className="text-xs text-gray-500 mt-1">配送地址</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <UserIcon className="text-gray-500" size={16} />
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{order.contact_name}</div>
                                                <div className="text-xs text-gray-500">客户姓名</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="text-gray-500" size={16} />
                                            <a href={`tel:${order.contact_phone}`} className="text-sm font-medium text-blue-400 hover:underline">
                                                {order.contact_phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {order.status === 'assigned' ? (
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'delivering')}
                                            className="btn btn-primary flex-1"
                                        >
                                            <Navigation size={18} />
                                            开始配送
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="btn btn-success flex-1"
                                            >
                                                <CheckCircle2 size={18} />
                                                确认送达并回瓶
                                            </button>
                                            <button className="btn btn-ghost">
                                                <ClipboardCheck size={18} />
                                                安全检查
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="h-1 bg-gray-800 group-hover:bg-blue-500 transition-colors"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 补丁：Layout.tsx中用到的User图标可能冲突
const UserIcon = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
