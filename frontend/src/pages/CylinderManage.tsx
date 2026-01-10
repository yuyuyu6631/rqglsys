import { useState, useEffect } from 'react';
import {
    Search, Plus, MoreVertical,
    RotateCcw, Trash2, Edit3, ShieldAlert
} from 'lucide-react';
import { cylinderApi } from '../services/api';
import type { Cylinder } from '../types/index';

export default function CylinderManage() {
    const [cylinders, setCylinders] = useState<Cylinder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        specs: '15kg',
        serial_code: '',
        manufacturer: '中燃集团',
        manufacture_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    const [filter, setFilter] = useState({ status: '', specs: '' });

    useEffect(() => {
        fetchCylinders();
    }, [filter]);

    const fetchCylinders = async () => {
        setLoading(true);
        try {
            const res = await cylinderApi.getCylinders(filter);
            setCylinders(res.data);
        } catch (err) {
            console.error('获取钢瓶列表失败', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCylinder = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await cylinderApi.createCylinder(formData);
            setShowModal(false);
            setFormData({
                specs: '15kg',
                serial_code: '',
                manufacturer: '中燃集团',
                manufacture_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
            fetchCylinders();
        } catch (err) {
            alert('添加失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定删除该钢瓶档案吗？')) return;
        try {
            await cylinderApi.deleteCylinder(id);
            fetchCylinders();
        } catch (err) {
            alert('删除失败');
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
                    <p className="text-sm text-gray-500 mt-1">管理全站燃气钢瓶生命周期与流转状态</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    新增钢瓶档案
                </button>
            </div>

            {/* 筛选栏 */}
            <div className="card mb-6 flex flex-wrap items-center gap-4">
                <div className="relative min-w-[300px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="搜索编号/规格/厂家..."
                        className="input pl-10"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        className="select w-36"
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="">所有状态</option>
                        <option value="in_stock">在库</option>
                        <option value="delivering">配送中</option>
                        <option value="in_use">使用中</option>
                        <option value="empty">空瓶</option>
                    </select>
                    <select
                        className="select w-36"
                        value={filter.specs}
                        onChange={(e) => setFilter({ ...filter, specs: e.target.value })}
                    >
                        <option value="">所有规格</option>
                        <option value="5kg">5kg</option>
                        <option value="15kg">15kg</option>
                        <option value="50kg">50kg</option>
                    </select>
                    <button
                        onClick={() => setFilter({ status: '', specs: '' })}
                        className="btn btn-ghost"
                    >
                        <RotateCcw size={16} />
                        重置
                    </button>
                </div>
            </div>

            {/* 表格 */}
            <div className="card overflow-hidden p-0 border-[#30363d] bg-[#161b22]">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-[#0d1117]">
                                <th className="pl-6">串码编号</th>
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
                                <tr>
                                    <td colSpan={7} className="text-center py-24">
                                        <div className="loading-spinner mx-auto border-blue-500"></div>
                                        <p className="text-sm text-gray-500 mt-4">正在加载钢瓶数据...</p>
                                    </td>
                                </tr>
                            ) : cylinders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-24 text-gray-600">
                                        暂无符合条件的钢瓶数据
                                    </td>
                                </tr>
                            ) : (
                                cylinders.map((cyl) => (
                                    <tr key={cyl.id} className="hover:bg-[#1f242c] transition-colors group">
                                        <td className="pl-6">
                                            <div className="font-mono text-sm tracking-tighter text-blue-400 font-bold">
                                                {cyl.serial_code}
                                            </div>
                                        </td>
                                        <td><span className="text-gray-300">{cyl.specs}</span></td>
                                        <td>
                                            <span className={`badge ${statusMap[cyl.status]?.class || 'badge-gray'}`}>
                                                {statusMap[cyl.status]?.label || cyl.status}
                                            </span>
                                        </td>
                                        <td className="text-gray-400">{cyl.manufacturer || '-'}</td>
                                        <td>
                                            <div className={`text-sm ${new Date(cyl.expiry_date || '') < new Date() ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                                                {cyl.expiry_date || '-'}
                                            </div>
                                        </td>
                                        <td className="text-gray-500 text-xs">
                                            {cyl.created_at?.split('T')[0]}
                                        </td>
                                        <td className="pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="编辑">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cyl.id)}
                                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400 transition-colors" title="删除">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 底部信息 */}
            {!loading && cylinders.length > 0 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500 px-2">
                    <div>共展现 <span className="text-gray-300 font-bold">{cylinders.length}</span> 条钢瓶纪录</div>
                    <div className="flex gap-2">
                        <button className="btn btn-ghost px-4 py-1.5 text-xs disabled:opacity-30">上一页</button>
                        <button className="btn btn-primary px-4 py-1.5 text-xs">1</button>
                        <button className="btn btn-ghost px-4 py-1.5 text-xs disabled:opacity-30">下一页</button>
                    </div>
                </div>
            )}

            {/* 新增Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg border border-[#30363d] shadow-2xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" />
                                新增钢瓶档案
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 transition-colors"
                            >✕</button>
                        </div>
                        <form onSubmit={handleAddCylinder} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">钢瓶规格</label>
                                    <select
                                        className="select"
                                        value={formData.specs}
                                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                                    >
                                        <option value="15kg">15kg (常用)</option>
                                        <option value="5kg">5kg (便携)</option>
                                        <option value="50kg">50kg (工业)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">钢瓶编号 (可选)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="CYL2024..."
                                        value={formData.serial_code}
                                        onChange={(e) => setFormData({ ...formData, serial_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">生产厂家</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="请输入厂家名称"
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">生产日期</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.manufacture_date}
                                        onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">有效截止日期</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                <ShieldAlert className="text-blue-500 shrink-0" size={20} />
                                <p className="text-xs text-blue-300/70 leading-relaxed">
                                    提示：新钢瓶入库后状态将自动设为“在库”，首次使用前请确保安全检查合格。
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost px-8">取消</button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary px-10 ${submitting ? 'btn-loading' : ''}`}
                                    disabled={submitting}
                                >
                                    确认入库
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

