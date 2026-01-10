import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag,
    ShieldCheck, Users, Bell, LogOut, Menu,
    ChevronRight
} from 'lucide-react';
import { authApi } from '../services/api';
import type { User } from '../types/index';

interface LayoutProps {
    user: User | null;
    onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        if (!confirm('确定要退出系统吗？')) return;
        try {
            await authApi.logout();
            onLogout();
            navigate('/login');
        } catch (err) {
            console.error('登出失败', err);
        }
    };

    const menuConfig: Record<string, { icon: any; label: string; path: string }[]> = {
        admin: [
            { icon: LayoutDashboard, label: '数据看板', path: '/admin' },
            { icon: Package, label: '钢瓶管理', path: '/admin/cylinders' },
            { icon: ShoppingBag, label: '订单管理', path: '/admin/orders' },
            { icon: ShieldCheck, label: '安全监管', path: '/admin/safety' },
            { icon: Users, label: '用户管理', path: '/admin/users' },
            { icon: Bell, label: '公告管理', path: '/admin/announcements' },
        ],
        station: [
            { icon: LayoutDashboard, label: '数据看板', path: '/admin' },
            { icon: Package, label: '钢瓶管理', path: '/admin/cylinders' },
            { icon: ShoppingBag, label: '订单管理', path: '/admin/orders' },
            { icon: ShieldCheck, label: '安全监管', path: '/admin/safety' },
        ],
        delivery: [
            { icon: ShoppingBag, label: '配送任务', path: '/delivery' },
            { icon: ShieldCheck, label: '安全检查', path: '/delivery/safety' },
        ],
        user: [
            { icon: LayoutDashboard, label: '个人中心', path: '/user' },
            { icon: ShoppingBag, label: '立即购气', path: '/user/order' },
            { icon: Bell, label: '历史订单', path: '/user/orders' },
        ]
    };

    const menuItems = user ? menuConfig[user.role] || [] : [];

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <ShoppingBag className="text-white" size={20} />
                    </div>
                    {isSidebarOpen && <span className="font-bold text-lg text-white truncate">燃气智能管理</span>}
                </div>

                <nav className="flex-1 py-6 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`menu-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} className="shrink-0" />
                                {isSidebarOpen && <span className="truncate">{item.label}</span>}
                                {isSidebarOpen && isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="menu-item w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-none m-0"
                    >
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span className="font-medium">退出系统</span>}
                    </button>
                </div>
            </aside>

            {/* Main Container */}
            <div className={`main-container ${!isSidebarOpen ? 'expanded' : ''}`}>
                {/* Header */}
                <header className="header">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                    >
                        {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-bold text-white leading-tight">{user?.real_name || user?.username}</div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-tighter">{user?.role}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shadow-inner">
                            {user?.username[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content Body */}
                <div className="content-body">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
