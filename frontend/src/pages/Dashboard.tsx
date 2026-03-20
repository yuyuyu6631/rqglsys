import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { AlertTriangle, ClipboardCheck, CreditCard, Package, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { statsApi } from '../services/api';
import type { CylinderSpecStat, DashboardStats, OrderTrend } from '../types/index';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e'];

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [trend, setTrend] = useState<OrderTrend[]>([]);
    const [specStats, setSpecStats] = useState<CylinderSpecStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, trendRes, specRes] = await Promise.all([
                statsApi.getDashboard(),
                statsApi.getOrderTrend(15),
                statsApi.getCylinderSpecs(),
            ]);
            setStats(statsRes.data);
            setTrend(trendRes.data);
            setSpecStats(specRes.data);
        } catch (err) {
            console.error('获取统计数据失败', err);
        } finally {
            setLoading(false);
        }
    };

    const totalSpecCount = useMemo(
        () => specStats.reduce((sum, item) => sum + item.count, 0),
        [specStats],
    );

    const pieData = useMemo(
        () => specStats.map((item) => ({ name: item.specs, value: item.count })),
        [specStats],
    );

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const cards = [
        { label: '今日营收', value: `¥${stats.today_revenue}`, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', hint: '已完成订单汇总' },
        { label: '今日订单', value: stats.today_orders, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', hint: '今日新增订单' },
        { label: '在库钢瓶', value: stats.in_stock, icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10', hint: '点击查看库存', path: '/admin/cylinders' },
        { label: '待处理订单', value: stats.pending_orders, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', hint: '点击进入派单', path: '/admin/orders' },
    ];

    const completionRate = stats.total_orders > 0
        ? `${((stats.completed_orders / stats.total_orders) * 100).toFixed(1)}%`
        : '0%';

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">业务数据概览</h2>
                <div className="text-sm text-gray-500">数据更新：{new Date().toLocaleTimeString()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <button
                        key={card.label}
                        onClick={() => {
                            if (card.path) navigate(card.path);
                        }}
                        className={`stat-card text-left ${card.path ? '' : 'cursor-default'}`}
                    >
                        <div className={`stat-icon ${card.bg} ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="stat-label uppercase tracking-wider">{card.label}</div>
                            <div className="stat-value">{card.value}</div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">{card.hint}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-200">近 15 日订单趋势</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#8b949e"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value: string) => value.split('-').slice(1).join('/')}
                                />
                                <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                                    itemStyle={{ color: '#e6edf3' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-gray-200 mb-6">钢瓶库存分布</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {pieData.map((item, index) => (
                                        <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {specStats.map((item, index) => (
                            <div key={item.specs} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                                    {item.specs} 规格
                                </div>
                                <span className="text-gray-200">
                                    {totalSpecCount > 0 ? `${Math.round((item.count / totalSpecCount) * 100)}%` : '0%'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <ClipboardCheck size={18} className="text-blue-400" />
                        系统关键指标
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">总注册用户</div>
                            <div className="text-xl font-bold">{stats.total_users}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">活跃配送员</div>
                            <div className="text-xl font-bold">{stats.total_delivery}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">待整改隐患</div>
                            <div className="text-xl font-bold">{stats.hazard_pending ?? 0}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">订单完成率</div>
                            <div className="text-xl font-bold">{completionRate}</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-amber-400" />
                        当前运营关注
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-200">30 天内到期钢瓶：{stats.expiring_soon ?? 0} 个</div>
                                    <div className="text-xs text-gray-500">建议尽快安排检查或调拨</div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/admin/cylinders')}
                                className="btn btn-ghost px-3 py-1 bg-rose-500/10 text-rose-500 border-none"
                            >
                                去处理
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <ClipboardCheck size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-200">待分配订单：{stats.pending_orders} 个</div>
                                    <div className="text-xs text-gray-500">已分配：{stats.assigned_orders ?? 0} 个，配送中：{stats.delivering_orders ?? 0} 个</div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/admin/orders')}
                                className="btn btn-ghost px-3 py-1 bg-blue-500/10 text-blue-400 border-none"
                            >
                                去分配
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
