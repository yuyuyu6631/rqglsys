import { useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, Plus, RotateCcw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { cylinderApi } from '../services/api';
import type { Cylinder } from '../types/index';
import { getErrorMessage } from '../utils/apiError';

const initialForm = {
    specs: '15kg',
    serial_code: '',
    manufacturer: '中燃集团',
    manufacture_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
};

export default function CylinderManage() {
    const [cylinders, setCylinders] = useState<Cylinder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [statusSubmitting, setStatusSubmitting] = useState(false);
    const [editingCylinder, setEditingCylinder] = useState<Cylinder | null>(null);
    const [detailCylinder, setDetailCylinder] = useState<Cylinder | null>(null);
    const [keyword, setKeyword] = useState('');
    const [formData, setFormData] = useState(initialForm);
    const [filter, setFilter] = useState({ status: '', specs: '' });

    useEffect(() => {
        fetchCylinders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.status, filter.specs]);

    const fetchCylinders = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filter.status) params.status = filter.status;
            if (filter.specs) params.specs = filter.specs;
            const res = await cylinderApi.getCylinders(params);
            setCylinders(res.data);
        } catch (err) {
            console.error('获取钢瓶列表失败', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCylinders = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        if (!text) return cylinders;
        return cylinders.filter((cyl) =>
            [cyl.serial_code, cyl.specs, cyl.manufacturer, cyl.status]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(text)),
        );
    }, [cylinders, keyword]);

    const openCreateModal = () => {
        setEditingCylinder(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    const openEditModal = (cylinder: Cylinder) => {
        setEditingCylinder(cylinder);
        setFormData({
            specs: cylinder.specs,
            serial_code: cylinder.serial_code,
            manufacturer: cylinder.manufacturer || '',
            manufacture_date: cylinder.manufacture_date || initialForm.manufacture_date,
            expiry_date: cylinder.expiry_date || initialForm.expiry_date,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCylinder) {
                await cylinderApi.updateCylinder(editingCylinder.id, formData);
            } else {
                await cylinderApi.createCylinder(formData);
            }
            setShowModal(false);
            setEditingCylinder(null);
            setFormData(initialForm);
            await fetchCylinders();
        } catch (err) {
            alert(getErrorMessage(err, '保存钢瓶失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定删除该钢瓶档案吗？')) return;
        try {
            await cylinderApi.deleteCylinder(id);
            await fetchCylinders();
        } catch (err) {
            alert(getErrorMessage(err, '删除钢瓶失败'));
        }
    };

    const handleStatusUpdate = async (cylinder: Cylinder, status: Cylinder['status']) => {
        setStatusSubmitting(true);
        try {
            const res = await cylinderApi.updateStatus(cylinder.id, status);
            setCylinders((prev) => prev.map((item) => (item.id === cylinder.id ? res.data : item)));
            setDetailCylinder(res.data);
        } catch (err) {
            alert(getErrorMessage(err, '更新钢瓶状态失败'));
        } finally {
            setStatusSubmitting(false);
        }
    };

    const statusMap: Record<string, { label: string; class: string }> = {
        in_stock: { label: '在库', class: 'badge-success' },
        delivering: { label: '配送中', class: 'badge-info' },
        in_use: { label: '使用中', class: 'badge-warning' },
        empty: { label: '空瓶', class: 'badge-gray' },
    };

    return (
        <div className="animate-fade-in text-gray-200">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">钢瓶档案管理</h2>
                    <p className="text-sm text-gray-500 mt-1">支持筛选、搜索、新增、编辑和详情查看</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    新增钢瓶档案
                </button>
            </div>

            <div className="card mb-6 flex flex-wrap items-center gap-4">
                <div className="relative min-w-[300px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="搜索编号、规格、厂家或状态" className="input pl-10" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <select className="select w-36" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                        <option value="">所有状态</option>
                        <option value="in_stock">在库</option>
                        <option value="delivering">配送中</option>
                        <option value="in_use">使用中</option>
                        <option value="empty">空瓶</option>
                    </select>
                    <select className="select w-36" value={filter.specs} onChange={(e) => setFilter({ ...filter, specs: e.target.value })}>
                        <option value="">所有规格</option>
                        <option value="5kg">5kg</option>
                        <option value="15kg">15kg</option>
                        <option value="50kg">50kg</option>
                    </select>
                    <button onClick={() => { setFilter({ status: '', specs: '' }); setKeyword(''); }} className="btn btn-ghost">
                        <RotateCcw size={16} />
                        重置
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden p-0 border-[#30363d] bg-[#161b22]">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-[#0d1117]">
                                <th className="pl-6">钢瓶编号</th>
                                <th>规格</th>
                                <th>状态</th>
                                <th>制造商</th>
                                <th>有效期</th>
                                <th>入库时间</th>
                                <th className="pr-6 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-24"><div className="loading-spinner mx-auto border-blue-500"></div></td></tr>
                            ) : filteredCylinders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-24 text-gray-600">暂无符合条件的钢瓶数据</td></tr>
                            ) : (
                                filteredCylinders.map((cyl) => (
                                    <tr key={cyl.id} className="hover:bg-[#1f242c] transition-colors group">
                                        <td className="pl-6"><div className="font-mono text-sm tracking-tighter text-blue-400 font-bold">{cyl.serial_code}</div></td>
                                        <td><span className="text-gray-300">{cyl.specs}</span></td>
                                        <td><span className={`badge ${statusMap[cyl.status]?.class || 'badge-gray'}`}>{statusMap[cyl.status]?.label || cyl.status}</span></td>
                                        <td className="text-gray-400">{cyl.manufacturer || '-'}</td>
                                        <td><div className={`text-sm ${cyl.expiry_date && new Date(cyl.expiry_date) < new Date() ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>{cyl.expiry_date || '-'}</div></td>
                                        <td className="text-gray-500 text-xs">{cyl.created_at?.split('T')[0]}</td>
                                        <td className="pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setDetailCylinder(cyl)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="详情"><Eye size={16} /></button>
                                                <button onClick={() => openEditModal(cyl)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="编辑"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(cyl.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400 transition-colors" title="删除"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && filteredCylinders.length > 0 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500 px-2">
                    <div>共展示 <span className="text-gray-300 font-bold">{filteredCylinders.length}</span> 条钢瓶记录</div>
                    <button onClick={fetchCylinders} className="btn btn-ghost px-4 py-1.5 text-xs">刷新数据</button>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg border border-[#30363d] shadow-2xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" />
                                {editingCylinder ? '编辑钢瓶档案' : '新增钢瓶档案'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">钢瓶规格</label>
                                    <select className="select" value={formData.specs} onChange={(e) => setFormData({ ...formData, specs: e.target.value })}>
                                        <option value="15kg">15kg</option>
                                        <option value="5kg">5kg</option>
                                        <option value="50kg">50kg</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">钢瓶编号</label>
                                    <input type="text" className="input" value={formData.serial_code} onChange={(e) => setFormData({ ...formData, serial_code: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">生产厂家</label>
                                <input type="text" className="input" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">生产日期</label>
                                    <input type="date" className="input" value={formData.manufacture_date} onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">有效期截止</label>
                                    <input type="date" className="input" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} required />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                <ShieldAlert className="text-blue-500 shrink-0" size={20} />
                                <p className="text-xs text-blue-300/70 leading-relaxed">首次使用前请确认钢瓶和附件检查合格。</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost px-8">取消</button>
                                <button type="submit" className={`btn btn-primary px-10 ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {detailCylinder && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">钢瓶详情</h3>
                            <button onClick={() => setDetailCylinder(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div>编号：{detailCylinder.serial_code}</div>
                            <div>规格：{detailCylinder.specs}</div>
                            <div>状态：{statusMap[detailCylinder.status]?.label || detailCylinder.status}</div>
                            <div>制造商：{detailCylinder.manufacturer || '无'}</div>
                            <div>生产日期：{detailCylinder.manufacture_date || '无'}</div>
                            <div>有效期：{detailCylinder.expiry_date || '无'}</div>
                            <div>站点：{detailCylinder.station_id || '未关联'}</div>
                            <div>创建时间：{detailCylinder.created_at || '无'}</div>
                        </div>
                        <div className="mt-6">
                            <div className="text-sm text-gray-500 mb-3">快捷状态变更</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(statusMap).map(([status, meta]) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(detailCylinder, status as Cylinder['status'])}
                                        className={`btn ${detailCylinder.status === status ? 'btn-primary' : 'btn-ghost'} px-3 py-1 text-xs ${statusSubmitting ? 'btn-loading' : ''}`}
                                        disabled={statusSubmitting || detailCylinder.status === status}
                                    >
                                        {meta.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
