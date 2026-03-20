import { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, Bell, Calendar, Edit3, Link2, Plus, Search, Trash2 } from 'lucide-react';
import { announcementApi } from '../services/api';
import type { Announcement } from '../types/index';
import { getErrorMessage } from '../utils/apiError';

const initialForm = {
    title: '',
    content: '',
    is_top: false,
};

export default function AnnouncementManage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);
    const [previewItem, setPreviewItem] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await announcementApi.getAnnouncements();
            setAnnouncements(res.data);
        } catch (err) {
            console.error('获取公告失败', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAnnouncements = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        if (!text) return announcements;
        return announcements.filter((item) =>
            [item.title, item.content, item.author_name]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(text)),
        );
    }, [announcements, keyword]);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    const openEditModal = (item: Announcement) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            is_top: item.is_top,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await announcementApi.updateAnnouncement(editingItem.id, formData);
            } else {
                await announcementApi.createAnnouncement(formData);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData(initialForm);
            await fetchData();
        } catch (err) {
            alert(getErrorMessage(err, '保存公告失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定删除这条公告吗？')) return;
        try {
            await announcementApi.deleteAnnouncement(id);
            await fetchData();
        } catch (err) {
            alert(getErrorMessage(err, '删除公告失败'));
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">通知公告发布</h2>
                    <p className="text-sm text-gray-500 mt-1">支持新建、编辑、预览和删除系统公告</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={18} />
                    发布新公告
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="card flex items-center gap-4 py-3">
                        <Search size={16} className="text-gray-500 ml-2" />
                        <input
                            className="bg-transparent border-none text-sm text-white focus:outline-none flex-1"
                            placeholder="搜索公告标题、内容或作者"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="card text-center py-20 text-gray-600">暂无匹配的公告</div>
                    ) : (
                        filteredAnnouncements.map((item) => (
                            <div key={item.id} className="card hover:border-gray-600 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        {item.is_top && (
                                            <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 font-bold flex items-center gap-1">
                                                <ArrowUpCircle size={10} /> 置顶
                                            </span>
                                        )}
                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEditModal(item)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-6">{item.content}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.created_at?.split('T')[0]}</span>
                                        <span className="flex items-center gap-1 font-medium text-gray-400">发布者 {item.author_name}</span>
                                    </div>
                                    <button
                                        onClick={() => setPreviewItem(item)}
                                        className="text-xs text-blue-400 font-medium hover:underline flex items-center gap-1"
                                    >
                                        预览全文 <Link2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                    <div className="card bg-blue-500/5 border-blue-500/10">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <Bell size={18} className="text-blue-400" />
                            发布说明
                        </h3>
                        <ul className="space-y-4 text-xs text-blue-200/60 leading-relaxed">
                            <li>标题建议简洁明确，突出时间和影响范围。</li>
                            <li>置顶公告会优先展示在用户首页。</li>
                            <li>安全提醒类公告建议保持置顶。</li>
                        </ul>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-2xl border border-[#30363d] shadow-2xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" />
                                {editingItem ? '编辑公告' : '发布新公告'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="form-group">
                                <label className="form-label font-bold text-gray-300">公告标题</label>
                                <input
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label font-bold text-gray-300">公告正文</label>
                                <textarea
                                    className="input min-h-[200px] resize-none py-4"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer group w-fit">
                                <input
                                    type="checkbox"
                                    id="is_top"
                                    className="w-4 h-4 rounded border-gray-800 bg-gray-900 accent-blue-500"
                                    checked={formData.is_top}
                                    onChange={(e) => setFormData({ ...formData, is_top: e.target.checked })}
                                />
                                <label htmlFor="is_top" className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">设为首页置顶</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost px-8 font-bold">取消</button>
                                <button type="submit" className={`btn btn-primary px-10 font-bold ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>
                                    保存公告
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {previewItem && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">{previewItem.title}</h3>
                            <button onClick={() => setPreviewItem(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="text-sm text-gray-400 mb-4">发布者：{previewItem.author_name}，时间：{previewItem.created_at?.split('T')[0]}</div>
                        <div className="text-gray-200 whitespace-pre-wrap leading-7">{previewItem.content}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
