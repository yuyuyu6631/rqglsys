import { useState, useEffect } from 'react';
import {
    Bell, Flame, ShoppingBag, History,
    ShieldCheck, PhoneCall, ChevronRight, FileText, Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { announcementApi, authApi } from '../services/api';
import type { Announcement, User } from '../types/index';

export default function UserHome() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState<Announcement | null>(null);
    const [showAnnouncementList, setShowAnnouncementList] = useState(false);
    const [showSafetyGuide, setShowSafetyGuide] = useState(false);
    const [showSupport, setShowSupport] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [announcementRes, userRes] = await Promise.all([
                announcementApi.getAnnouncements(),
                authApi.getCurrentUser(),
            ]);
            setAnnouncements(announcementRes.data);
            setCurrentUser(userRes.data);
        } catch (err) {
            console.error('获取公告失败', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            {/* 欢迎头部 */}
            <div className="relative overflow-hidden rounded-3xl p-8 text-white h-60 flex flex-col justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">欢迎回来，{currentUser?.real_name || currentUser?.username || '用户'}</h2>
                    <p className="text-blue-100 opacity-80">今日气温 4°C，请注意用气安全，开窗通风。</p>
                    <button
                        onClick={() => navigate('/user/order')}
                        className="mt-6 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
                    >
                        <ShoppingBag size={20} />
                        立即下单购气
                    </button>
                </div>
                <Flame size={180} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 快捷操作 */}
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <ShoppingBag className="text-blue-400" size={20} />
                        快捷服务
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/user/order')}
                            className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px]"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-3">
                                <Flame size={24} />
                            </div>
                            <span className="font-medium">在线预约购气</span>
                        </button>
                        <button
                            onClick={() => navigate('/user/orders')}
                            className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px]"
                        >
                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 mb-3">
                                <History size={24} />
                            </div>
                            <span className="font-medium">历史订单查询</span>
                        </button>
                        <button
                            onClick={() => setShowSafetyGuide(true)}
                            className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px] text-left"
                        >
                            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 mb-3">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="font-medium">用气安全指南</span>
                        </button>
                        <button
                            onClick={() => setShowSupport(true)}
                            className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px] text-left"
                        >
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-3">
                                <PhoneCall size={24} />
                            </div>
                            <span className="font-medium">联系客服/报修</span>
                        </button>
                    </div>
                </div>

                {/* 公告栏 */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="text-blue-400" size={20} />
                        通知公告
                    </h3>
                    <div className="card p-0 divide-y divide-gray-800">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">加载中...</div>
                        ) : announcements.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">暂无通知</div>
                        ) : (
                            announcements.slice(0, 4).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setPreviewItem(item)}
                                    className="w-full p-4 hover:bg-white/5 text-left"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.is_top && (
                                            <span className="bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">置顶</span>
                                        )}
                                        <span className="text-sm font-medium text-gray-200 truncate">{item.title}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.content}</p>
                                </button>
                            ))
                        )}
                        <button
                            onClick={() => setShowAnnouncementList(true)}
                            className="w-full py-3 text-xs text-gray-500 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors"
                        >
                            查看全部 <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {previewItem && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">{previewItem.title}</h3>
                            <button onClick={() => setPreviewItem(null)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                            发布者：{previewItem.author_name || '系统管理员'} · {previewItem.created_at?.split('T')[0]}
                        </div>
                        <div className="text-gray-200 whitespace-pre-wrap leading-7">{previewItem.content}</div>
                    </div>
                </div>
            )}

            {showAnnouncementList && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-3xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-blue-400" />
                                全部公告
                            </h3>
                            <button onClick={() => setShowAnnouncementList(false)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                            {announcements.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setShowAnnouncementList(false);
                                        setPreviewItem(item);
                                    }}
                                    className="w-full text-left p-4 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {item.is_top && <span className="badge badge-danger">置顶</span>}
                                        <div className="font-semibold text-white">{item.title}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{item.created_at?.split('T')[0]}</div>
                                    <div className="text-sm text-gray-400 line-clamp-2">{item.content}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showSafetyGuide && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck size={18} className="text-rose-400" />
                                用气安全指南
                            </h3>
                            <button onClick={() => setShowSafetyGuide(false)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-300 leading-7">
                            <p>1. 使用燃气时保持厨房通风，离开前确认阀门关闭。</p>
                            <p>2. 闻到异味时不要开灯或使用明火，立即开窗并联系专业人员处理。</p>
                            <p>3. 胶管老化、接口松动、减压阀异常时应立即暂停使用并报修。</p>
                            <p>4. 建议定期预约入户安检，发现隐患及时整改并保留照片记录。</p>
                        </div>
                    </div>
                </div>
            )}

            {showSupport && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Headphones size={18} className="text-emerald-400" />
                                客服与报修
                            </h3>
                            <button onClick={() => setShowSupport(false)} className="btn btn-ghost px-3">关闭</button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                                <div className="text-gray-500 mb-1">客服热线</div>
                                <a href="tel:400-800-5173" className="text-lg text-blue-400 hover:underline">400-800-5173</a>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                                <div className="text-gray-500 mb-1">紧急报修</div>
                                <div className="text-lg text-rose-400">010-8899-1100</div>
                            </div>
                            <div className="text-xs text-gray-500 leading-6">
                                如遇燃气泄漏、阀门故障或钢瓶异常，请先关闭气源并保持通风，再拨打紧急报修电话。
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
