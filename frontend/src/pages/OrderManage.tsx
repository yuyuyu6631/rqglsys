import { useState, useEffect } from 'react';
import {
    Truck, CheckCircle2,
    XCircle, Clock, Phone, User as UserIcon
} from 'lucide-react';
import { orderApi, userApi } from '../services/api';
import type { Order, User } from '../types/index';

export default function OrderManage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [deliveries, setDeliveries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState<Order | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orderRes, userRes] = await Promise.all([
                orderApi.getOrders(),
                userApi.getUsers('delivery')
            ]);
            setOrders(orderRes.data);
            setDeliveries(userRes.data);
        } catch (err) {
            console.error('获取订单数据失败', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!showAssignModal || !selectedDelivery) return;
        setAssigning(true);
        try {
            await orderApi.assignOrder(showAssignModal.id, Number(selectedDelivery));
            setShowAssignModal(null);
            setSelectedDelivery('');
            fetchData();
        } catch (err) {
            alert('分配失败');
        } finally {
            setAssigning(false);
        }
    };

    const statusMap: Record<string, { label: string; class: string; icon: any }> = {
        pending: { label: '待分配', class: 'badge-danger', icon: Clock },
        assigned: { label: '已分配', class: 'badge-info', icon: UserIcon },
        delivering: { label: '配送中', class: 'badge-warning', icon: Truck },
        completed: { label: '已完成', class: 'badge-success', icon: CheckCircle2 },
        cancelled: { label: '已取消', class: 'badge-gray', icon: XCircle },
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">订单调度管理</h2>
                    <p className="text-sm text-gray-500 mt-1">处理用户购气订单，监控配送进度与服务质量</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost">导出报表</button>
                    <button onClick={fetchData} className="btn btn-primary">
                        刷新列表
                    </button>
                </div>
            </div>

            {/* 状态统计 */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                {Object.entries(statusMap).map(([key, value]) => (
                    <div key={key} className="card p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-600">
                        <value.icon size={20} className={value.class.replace('badge-', 'text-')} />
                        <div className="text-xs text-gray-500 mt-2">{value.label}</div>
                        <div className="text-xl font-bold mt-1">
                            {orders.filter(o => o.status === key).length}
                        </div>
                    </div>
                ))}
            </div>

            {/* 表格 */}
            <div className="card overflow-hidden p-0">
                <table className="table">
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>客户信息</th>
                            <th>规格/数量</th>
                            <th>金额</th>
                            <th>状态</th>
                            <th>配送员</th>
                            <th>下单时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-20">
                                    <div className="loading-spinner mx-auto"></div>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-state">暂无订单数据</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <div className="font-mono text-xs text-blue-400 font-bold">{order.order_no}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{order.contact_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Phone size={10} /> {order.contact_phone}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{order.specs}</div>
                                        <div className="text-xs text-gray-500">×{order.quantity}个瓶</div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-bold text-gray-200">¥{order.total_amount}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusMap[order.status]?.class}`}>
                                            {statusMap[order.status]?.label}
                                        </span>
                                    </td>
                                    <td>
                                        {order.delivery_name ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-bold">
                                                    {order.delivery_name[0]}
                                                </div>
                                                {order.delivery_name}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-xs italic">未指定</span>
                                        )}
                                    </td>
                                    <td className="text-gray-500 text-xs">
                                        {order.created_at?.replace('T', ' ').split('.')[0]}
                                    </td>
                                    <td>
                                        {order.status === 'pending' ? (
                                            <button
                                                onClick={() => setShowAssignModal(order)}
                                                className="btn btn-primary px-3 py-1 text-xs"
                                            >
                                                去派单
                                            </button>
                                        ) : (
                                            <button className="btn btn-ghost px-3 py-1 text-xs">详情</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 派单Modal */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-md">
                        <h3 className="text-xl font-bold mb-6">订单派分</h3>

                        <div className="p-4 rounded-lg bg-[#0d1117] mb-6 space-y-2">
                            <div className="text-sm flex justify-between">
                                <span className="text-gray-500 font-medium">订单编号：</span>
                                <span className="text-blue-400 font-mono">{showAssignModal.order_no}</span>
                            </div>
                            <div className="text-sm flex justify-between">
                                <span className="text-gray-500 font-medium">配送地址：</span>
                                <span className="text-gray-200 text-right max-w-[200px]">{showAssignModal.address}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">选择配送员</label>
                            <select
                                className="select"
                                value={selectedDelivery}
                                onChange={(e) => setSelectedDelivery(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">-- 请选择空闲配送员 --</option>
                                {deliveries.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.real_name} ({d.username}) - 手机: {d.phone}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowAssignModal(null)}
                                className="btn btn-ghost"
                            >取消</button>
                            <button
                                onClick={handleAssign}
                                className={`btn btn-primary ${assigning ? 'btn-loading' : ''}`}
                                disabled={!selectedDelivery || assigning}
                            >
                                确认派单
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
