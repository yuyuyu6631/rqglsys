import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { safetyApi } from '../services/api';
import type { SafetyRecord } from '../types/index';
import { getErrorMessage } from '../utils/apiError';

export default function SafetyManage() {
    const [records, setRecords] = useState<SafetyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRecordId, setUpdatingRecordId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [detailRecord, setDetailRecord] = useState<SafetyRecord | null>(null);

    useEffect(() => {
        fetchRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelFilter]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await safetyApi.getRecords(levelFilter ? { hazard_level: levelFilter } : undefined);
            setRecords(res.data);
        } catch (err) {
            console.error('获取安检记录失败', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        if (!text) return records;
        return records.filter((record) =>
            [record.order_no, record.inspector_name, record.hazard_description]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(text)),
        );
    }, [keyword, records]);

    const handleRectify = async (record: SafetyRecord) => {
        setUpdatingRecordId(record.id);
        try {
            const res = await safetyApi.updateRecord(record.id, { rectify_status: 'completed' });
            setRecords((prev) => prev.map((item) => (item.id === record.id ? res.data : item)));
            setDetailRecord((prev) => (prev?.id === record.id ? res.data : prev));
        } catch (err) {
            alert(getErrorMessage(err, '更新整改状态失败'));
        } finally {
            setUpdatingRecordId(null);
        }
    };

    const renderPhotoLinks = (photos?: string[]) => {
        if (!photos?.length) return <span className="text-gray-500">无</span>;
        return (
            <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                    <a
                        key={`${photo}-${index}`}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline break-all"
                    >
                        附件 {index + 1}
                    </a>
                ))}
            </div>
        );
    };

    const exportReport = () => {
        const headers = ['订单号', '检查员', '隐患等级', '整改状态', '检查时间', '隐患描述'];
        const rows = filteredRecords.map((record) => [
            record.order_no || '',
            record.inspector_name || '',
            record.hazard_level,
            record.rectify_status || '',
            record.created_at || '',
            record.hazard_description || '',
        ]);
        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'safety-records.csv';
        link.click();
        URL.revokeObjectURL(link.href);
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
                    <p className="text-sm text-gray-500 mt-1">支持筛选、导出和详情查看</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={exportReport}>统计报表</button>
                    <button className="btn btn-primary" onClick={fetchRecords}>同步数据</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card text-center p-6"><div className="text-3xl font-bold text-white mb-1">{records.length}</div><div className="text-xs text-gray-500 uppercase">总安检次数</div></div>
                <div className="card text-center p-6 border-emerald-500/10"><div className="text-3xl font-bold text-emerald-500 mb-1">{records.filter((r) => r.hazard_level === 'none').length}</div><div className="text-xs text-gray-500 uppercase">安全无隐患</div></div>
                <div className="card text-center p-6 border-rose-500/10"><div className="text-3xl font-bold text-rose-500 mb-1">{records.filter((r) => r.hazard_level !== 'none').length}</div><div className="text-xs text-gray-500 uppercase">累计发现隐患</div></div>
                <div className="card text-center p-6 border-amber-500/10"><div className="text-3xl font-bold text-amber-500 mb-1">{records.filter((r) => r.rectify_status === 'pending').length}</div><div className="text-xs text-gray-500 uppercase">待整改隐患</div></div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-bottom border-gray-800 flex items-center gap-4 bg-[#161b22]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input className="input pl-10 border-none bg-[#0d1117]" placeholder="搜索订单号、检查员或隐患描述" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    </div>
                    <select className="select w-auto bg-[#0d1117]" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
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
                            <th>整改状态</th>
                            <th>检查时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-20"><div className="loading-spinner mx-auto"></div></td></tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr><td colSpan={6} className="empty-state">暂无安检记录</td></tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id}>
                                    <td><div className="font-mono text-xs text-blue-400 font-bold">{record.order_no || '-'}</div></td>
                                    <td><div className="text-sm text-gray-200">{record.inspector_name || '-'}</div></td>
                                    <td><span className={`badge ${levelBadges[record.hazard_level]?.class}`}>{levelBadges[record.hazard_level]?.label}</span></td>
                                    <td>{record.hazard_level === 'none' ? '-' : <span className={`text-xs ${record.rectify_status === 'completed' ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>{record.rectify_status === 'completed' ? '已整改' : '待处理'}</span>}</td>
                                    <td className="text-gray-500 text-xs">{record.created_at?.split('T')[0]}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDetailRecord(record)} className="btn btn-ghost px-3 py-1 text-xs">详情</button>
                                            {record.rectify_status === 'pending' && (
                                                <button
                                                    onClick={() => handleRectify(record)}
                                                    className={`btn btn-success px-3 py-1 text-xs ${updatingRecordId === record.id ? 'btn-loading' : ''}`}
                                                    disabled={updatingRecordId === record.id}
                                                >
                                                    整改完成
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {detailRecord && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">安检记录详情</h3>
                            <button onClick={() => setDetailRecord(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div>订单号：{detailRecord.order_no || '无'}</div>
                            <div>检查员：{detailRecord.inspector_name || '无'}</div>
                            <div>隐患等级：{levelBadges[detailRecord.hazard_level]?.label}</div>
                            <div>整改状态：{detailRecord.rectify_status || '无'}</div>
                            <div>隐患描述：{detailRecord.hazard_description || '无'}</div>
                            <div>检查项：{detailRecord.check_items || '无'}</div>
                            <div>现场照片：{renderPhotoLinks(detailRecord.photos)}</div>
                            <div>整改附件：{renderPhotoLinks(detailRecord.rectify_photos)}</div>
                        </div>
                        {detailRecord.rectify_status === 'pending' && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => handleRectify(detailRecord)}
                                    className={`btn btn-success ${updatingRecordId === detailRecord.id ? 'btn-loading' : ''}`}
                                    disabled={updatingRecordId === detailRecord.id}
                                >
                                    <CheckCircle2 size={16} />
                                    标记为已整改
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
