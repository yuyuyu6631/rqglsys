import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock, Package, Search, Truck, XCircle } from 'lucide-react';
import { orderApi, ratingApi } from '../services/api';
import type { Order } from '../types/index';
import { getErrorMessage } from '../utils/apiError';

const statusMap: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    pending: { label: '待处理', class: 'badge-danger', icon: Clock },
    assigned: { label: '已接单', class: 'badge-info', icon: Package },
    delivering: { label: '配送中', class: 'badge-warning', icon: Truck },
    completed: { label: '已送达', class: 'badge-success', icon: CheckCircle2 },
    cancelled: { label: '已取消', class: 'badge-gray', icon: XCircle },
};

export default function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

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

    const filteredOrders = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        if (!text) return orders;
        return orders.filter((order) =>
            [order.order_no, order.address, order.contact_name, order.specs]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(text)),
        );
    }, [keyword, orders]);

    const submitRating = async () => {
        if (!ratingOrder) return;
        setSubmitting(true);
        try {
            await ratingApi.createRating({
                order_id: ratingOrder.id,
                score: ratingScore,
                comment: ratingComment,
            });
            alert('评价提交成功');
            setRatingOrder(null);
            setRatingComment('');
            setRatingScore(5);
        } catch (err: unknown) {
            alert(getErrorMessage(err, '评价提交失败'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">我的购气订单</h2>
                    <p className="text-sm text-gray-500 mt-1">查看进行中和历史订单，支持详情与评价</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        className="input pl-10 py-2 w-64"
                        placeholder="搜索订单号或地址"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="loading-spinner"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="card text-center py-20">
                    <ClipboardList size={48} className="text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-400">暂无匹配的订单记录</h3>
                    <p className="text-sm text-gray-600 mt-2">可以返回下单页创建新的订单</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
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
                                        {order.specs} 燃气 x {order.quantity}
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">{order.address}</p>
                                </div>

                                <div className="text-left md:text-right shrink-0">
                                    <div className="text-xl font-bold text-gray-200">¥{order.total_amount}</div>
                                    <div className="text-xs text-gray-500 mt-1">{order.created_at?.split('T')[0]}</div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-800 md:border-t-0">
                                    <button
                                        onClick={() => setDetailOrder(order)}
                                        className="btn btn-ghost flex-1 md:flex-none px-4 py-2 text-xs"
                                    >
                                        查看详情
                                    </button>
                                    {order.status === 'completed' && (
                                        <button
                                            onClick={() => setRatingOrder(order)}
                                            className="btn btn-primary flex-1 md:flex-none px-4 py-2 text-xs"
                                        >
                                            立即评价
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            <div>状态：{statusMap[detailOrder.status]?.label || detailOrder.status}</div>
                            <div>规格：{detailOrder.specs}</div>
                            <div>数量：{detailOrder.quantity}</div>
                            <div>金额：¥{detailOrder.total_amount}</div>
                            <div>联系人：{detailOrder.contact_name}</div>
                            <div>联系电话：{detailOrder.contact_phone}</div>
                            <div>地址：{detailOrder.address}</div>
                            <div>配送员：{detailOrder.delivery_name || '暂未分配'}</div>
                            <div>备注：{detailOrder.remark || '无'}</div>
                        </div>
                    </div>
                </div>
            )}

            {ratingOrder && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">订单评价</h3>
                            <button onClick={() => setRatingOrder(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-400 mb-2">评分</div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <button
                                            key={score}
                                            onClick={() => setRatingScore(score)}
                                            className={`btn ${ratingScore === score ? 'btn-primary' : 'btn-ghost'} px-4`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="input min-h-[120px]"
                                placeholder="写下你的使用体验"
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setRatingOrder(null)} className="btn btn-ghost">取消</button>
                                <button onClick={submitRating} disabled={submitting} className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}>
                                    提交评价
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
