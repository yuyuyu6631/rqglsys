import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock, Phone, Truck, User as UserIcon, XCircle } from 'lucide-react';
import { orderApi, userApi } from '../services/api';
import type { Order, User } from '../types/index';
import { getErrorMessage } from '../utils/apiError';

const statusMap: Record<string, { label: string; class: string; icon: LucideIcon }> = {
    pending: { label: '待分配', class: 'badge-danger', icon: Clock },
    assigned: { label: '已分配', class: 'badge-info', icon: UserIcon },
    delivering: { label: '配送中', class: 'badge-warning', icon: Truck },
    completed: { label: '已完成', class: 'badge-success', icon: CheckCircle2 },
    cancelled: { label: '已取消', class: 'badge-gray', icon: XCircle },
};

export default function OrderManage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [deliveries, setDeliveries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState<Order | null>(null);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orderRes, userRes] = await Promise.all([
                orderApi.getOrders(),
                userApi.getUsers('delivery'),
            ]);
            setOrders(orderRes.data);
            setDeliveries(userRes.data);
        } catch (err) {
            console.error('获取订单数据失败', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(
        () => (statusFilter ? orders.filter((order) => order.status === statusFilter) : orders),
        [orders, statusFilter],
    );

    const openAssignModal = (order: Order) => {
        setDetailOrder(null);
        setShowAssignModal(order);
        setSelectedDelivery(order.delivery_id ?? '');
    };

    const openDetailModal = (order: Order) => {
        setShowAssignModal(null);
        setSelectedDelivery('');
        setDetailOrder(order);
    };

    const closeAssignModal = () => {
        setShowAssignModal(null);
        setSelectedDelivery('');
    };

    const handleAssign = async () => {
        if (!showAssignModal || !selectedDelivery) return;
        setAssigning(true);
        try {
            const response = await orderApi.assignOrder(showAssignModal.id, Number(selectedDelivery));
            closeAssignModal();
            setDetailOrder(response.data);
            await fetchData();
        } catch (err) {
            alert(getErrorMessage(err, '分配失败'));
        } finally {
            setAssigning(false);
        }
    };

    const exportOrders = () => {
        const headers = ['订单号', '客户', '电话', '规格', '数量', '金额', '状态', '配送员', '地址'];
        const rows = filteredOrders.map((order) => [
            order.order_no,
            order.contact_name,
            order.contact_phone,
            order.specs,
            String(order.quantity),
            String(order.total_amount),
            order.status,
            order.delivery_name || '',
            order.address,
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'orders-export.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">订单调度管理</h2>
                    <p className="text-sm text-gray-500 mt-1">支持刷新、筛选、详情查看和派单</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportOrders} className="btn btn-ghost">导出报表</button>
                    <button onClick={fetchData} className="btn btn-primary">刷新列表</button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-6">
                {Object.entries(statusMap).map(([key, value]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter((prev) => (prev === key ? '' : key))}
                        className={`card p-4 flex flex-col items-center justify-center text-center hover:border-gray-600 ${statusFilter === key ? 'border-blue-500' : ''}`}
                    >
                        <value.icon size={20} className={value.class.replace('badge-', 'text-')} />
                        <div className="text-xs text-gray-500 mt-2">{value.label}</div>
                        <div className="text-xl font-bold mt-1">{orders.filter((order) => order.status === key).length}</div>
                    </button>
                ))}
            </div>

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
                            <tr><td colSpan={8} className="text-center py-20"><div className="loading-spinner mx-auto"></div></td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={8} className="empty-state">暂无符合条件的订单</td></tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td><div className="font-mono text-xs text-blue-400 font-bold">{order.order_no}</div></td>
                                    <td>
                                        <div className="text-sm">{order.contact_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={10} /> {order.contact_phone}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{order.specs}</div>
                                        <div className="text-xs text-gray-500">x {order.quantity}</div>
                                    </td>
                                    <td><div className="text-sm font-bold text-gray-200">¥{order.total_amount}</div></td>
                                    <td><span className={`badge ${statusMap[order.status]?.class}`}>{statusMap[order.status]?.label}</span></td>
                                    <td>{order.delivery_name || <span className="text-gray-600 text-xs italic">未指定</span>}</td>
                                    <td className="text-gray-500 text-xs">{order.created_at?.replace('T', ' ').split('.')[0]}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {order.status === 'pending' && (
                                                <button onClick={() => openAssignModal(order)} className="btn btn-primary px-3 py-1 text-xs">去派单</button>
                                            )}
                                            <button onClick={() => openDetailModal(order)} className="btn btn-ghost px-3 py-1 text-xs">详情</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-md">
                        <h3 className="text-xl font-bold mb-6">订单派单</h3>
                        <div className="p-4 rounded-lg bg-[#0d1117] mb-6 space-y-2">
                            <div className="text-sm flex justify-between"><span className="text-gray-500 font-medium">订单编号：</span><span className="text-blue-400 font-mono">{showAssignModal.order_no}</span></div>
                            <div className="text-sm flex justify-between gap-4"><span className="text-gray-500 font-medium shrink-0">配送地址：</span><span className="text-gray-200 text-right">{showAssignModal.address}</span></div>
                            <div className="text-sm flex justify-between"><span className="text-gray-500 font-medium">订单金额：</span><span className="text-gray-200">¥{showAssignModal.total_amount}</span></div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">选择配送员</label>
                            <select className="select" value={selectedDelivery} onChange={(e) => setSelectedDelivery(e.target.value ? Number(e.target.value) : '')}>
                                <option value="">-- 请选择配送员 --</option>
                                {deliveries.map((delivery) => (
                                    <option key={delivery.id} value={delivery.id}>
                                        {delivery.real_name || delivery.username} ({delivery.phone || '无电话'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={closeAssignModal} className="btn btn-ghost">取消</button>
                            <button onClick={handleAssign} className={`btn btn-primary ${assigning ? 'btn-loading' : ''}`} disabled={!selectedDelivery || assigning}>确认派单</button>
                        </div>
                    </div>
                </div>
            )}

            {detailOrder && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">订单详情</h3>
                            <button onClick={() => setDetailOrder(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div>订单号：{detailOrder.order_no}</div>
                            <div>客户：{detailOrder.contact_name}</div>
                            <div>电话：{detailOrder.contact_phone}</div>
                            <div>规格：{detailOrder.specs}</div>
                            <div>数量：{detailOrder.quantity}</div>
                            <div>金额：¥{detailOrder.total_amount}</div>
                            <div>状态：{statusMap[detailOrder.status]?.label || detailOrder.status}</div>
                            <div>配送员：{detailOrder.delivery_name || '未分配'}</div>
                            <div>地址：{detailOrder.address}</div>
                            <div>备注：{detailOrder.remark || '无'}</div>
                            <div>已分配钢瓶：{detailOrder.allocated_cylinders?.length ? detailOrder.allocated_cylinders.join('、') : '暂未分配'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
