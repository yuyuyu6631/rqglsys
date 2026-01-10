import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { safetyApi } from '../services/api';
import type { SafetyRecord } from '../types/index';

export default function SafetyManage() {
    const [records, setRecords] = useState<SafetyRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await safetyApi.getRecords();
            setRecords(res.data);
        } catch (err) {
            console.error('获取安检记录失败', err);
        } finally {
            setLoading(false);
        }
    };

    const levelBadges: Record<string, { label: string; class: string }> = {
        none: { label: '安全', class: 'badge-success' },
        low: { label: '一般隐患', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        medium: { label: '较大隐患', class: 'badge-warning' },
        high: { label: '重大隐患', class: 'badge-danger' },
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">入户安检监管</h2>
                    <p className="text-sm text-gray-500 mt-1">监控每一次配送过程中的入户安全检查记录与隐患整改情况</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost">统计报表</button>
                    <button className="btn btn-primary" onClick={fetchRecords}>同步数据</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card text-center p-6">
                    <div className="text-3xl font-bold text-white mb-1">{records.length}</div>
                    <div className="text-xs text-gray-500 uppercase">总安检次数</div>
                </div>
                <div className="card text-center p-6 border-emerald-500/10">
                    <div className="text-3xl font-bold text-emerald-500 mb-1">
                        {records.filter(r => r.hazard_level === 'none').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">安全无隐患</div>
                </div>
                <div className="card text-center p-6 border-rose-500/10">
                    <div className="text-3xl font-bold text-rose-500 mb-1">
                        {records.filter(r => r.hazard_level !== 'none').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">累计发现隐患</div>
                </div>
                <div className="card text-center p-6 border-amber-500/10">
                    <div className="text-3xl font-bold text-amber-500 mb-1">
                        {records.filter(r => r.rectify_status === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">待整改隐患</div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-bottom border-gray-800 flex items-center gap-4 bg-[#161b22]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input className="input pl-10 border-none bg-[#0d1117]" placeholder="搜索订单编号/检查员..." />
                    </div>
                    <select className="select w-auto bg-[#0d1117]">
                        <option value="">隐患等级</option>
                        <option value="none">安全</option>
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                    </select>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>关联订单</th>
                            <th>检查员</th>
                            <th>隐患等级</th>
                            <th>检查项点</th>
                            <th>整改状态</th>
                            <th>检查时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-20"><div className="loading-spinner mx-auto"></div></td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={7} className="empty-state">暂无安检记录</td></tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        <div className="font-mono text-xs text-blue-400 font-bold">{record.order_no || 'ORD-TEST-001'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-200">{record.inspector_name}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${levelBadges[record.hazard_level]?.class}`}>
                                            {levelBadges[record.hazard_level]?.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            {['阀门', '软管', '探头'].map((item, i) => (
                                                <span key={i} className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[8px] font-bold">
                                                    {item[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        {record.hazard_level === 'none' ? '-' : (
                                            <span className={`text-xs ${record.rectify_status === 'completed' ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>
                                                {record.rectify_status === 'completed' ? '已整改' : '待处理'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-gray-500 text-xs">
                                        {record.created_at?.split('T')[0]}
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost px-3 py-1 text-xs">详情</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
