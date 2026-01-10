import { useState, useEffect } from 'react';
import {
    Bell, Flame, ShoppingBag, History,
    ShieldCheck, PhoneCall, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { announcementApi } from '../services/api';
import type { Announcement } from '../types/index';

export default function UserHome() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await announcementApi.getAnnouncements();
            setAnnouncements(res.data);
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
                    <h2 className="text-3xl font-bold mb-2">欢迎回来，陈先生</h2>
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
                        <div className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px] cursor-pointer">
                            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 mb-3">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="font-medium">用气安全指南</span>
                        </div>
                        <div className="card flex flex-col items-center justify-center p-6 hover:translate-y-[-4px] cursor-pointer">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-3">
                                <PhoneCall size={24} />
                            </div>
                            <span className="font-medium">联系客服/报修</span>
                        </div>
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
                            announcements.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.is_top && (
                                            <span className="bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">置顶</span>
                                        )}
                                        <span className="text-sm font-medium text-gray-200 truncate">{item.title}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.content}</p>
                                </div>
                            ))
                        )}
                        <button className="w-full py-3 text-xs text-gray-500 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors">
                            查看全部 <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
