import { useState, useEffect } from 'react';
import {
    ClipboardList, Package, Truck,
    CheckCircle2, XCircle, Clock, Search
} from 'lucide-react';
import { orderApi } from '../services/api';
import type { Order } from '../types/index';

export default function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderApi.getOrders();
            setOrders(res.data);
        } catch (err) {
            console.error('获取订单失败', err);
        } finally {
            setLoading(false);
        }
    };

    const statusMap: Record<string, { label: string; class: string; icon: any }> = {
        pending: { label: '待处理', class: 'badge-danger', icon: Clock },
        assigned: { label: '已接单', class: 'badge-info', icon: Package },
        delivering: { label: '配送中', class: 'badge-warning', icon: Truck },
        completed: { label: '已送达', class: 'badge-success', icon: CheckCircle2 },
        cancelled: { label: '已取消', class: 'badge-gray', icon: XCircle },
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">我的购气订单</h2>
                    <p className="text-sm text-gray-500 mt-1">查看正在进行中或历史已完成的任务</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input className="input pl-10 py-2 w-64" placeholder="搜索订单编号..." />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="loading-spinner"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="card text-center py-20">
                    <ClipboardList size={48} className="text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-400">还没有订单记录</h3>
                    <p className="text-sm text-gray-600 mt-2">点击“购气大厅”开始您的第一次订购吧</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = statusMap[order.status];
                        return (
                            <div key={order.id} className="card p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:bg-white/[0.02]">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${status.class.replace('badge-', 'bg-').replace('-success', '-emerald-500').replace('-danger', '-rose-500').replace('-info', '-blue-500').replace('-warning', '-orange-500')}/10 ${status.class.replace('badge-', 'text-').replace('-success', '-emerald-400').replace('-danger', '-rose-400').replace('-info', '-blue-400').replace('-warning', '-orange-400')}`}>
                                    <status.icon size={24} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-500">{order.order_no}</span>
                                        <span className={`badge ${status.class}`}>{status.label}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white truncate">
                                        {order.specs} 燃气 × {order.quantity}
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                        {order.address}
                                    </p>
                                </div>

                                <div className="text-left md:text-right shrink-0">
                                    <div className="text-xl font-bold text-gray-200">¥{order.total_amount}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {order.created_at?.split('T')[0]}
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-800 md:border-t-0">
                                    <button className="btn btn-ghost flex-1 md:flex-none px-4 py-2 text-xs">
                                        查看详情
                                    </button>
                                    {order.status === 'completed' && (
                                        <button className="btn btn-primary flex-1 md:flex-none px-4 py-2 text-xs">
                                            即刻评价
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
