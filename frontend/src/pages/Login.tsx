import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock, User as UserIcon, LogIn, ShieldCheck,
    Flame, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { authApi } from '../services/api';
import type { User } from '../types/index';

interface LoginProps {
    onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authApi.login(username, password);
            const user = res.data.user;
            onLogin(user);

            // 根据角色跳转
            const routes: Record<string, string> = {
                admin: '/admin',
                station: '/admin',
                delivery: '/delivery',
                user: '/user',
            };
            navigate(routes[user.role] || '/');
        } catch (err: any) {
            setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (u: string, p: string) => {
        setUsername(u);
        setPassword(p);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: 'url(/assets/system-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* 半透明遮罩层提高可读性 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-6 group transition-transform hover:scale-110">
                        <Flame className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">燃气管理系统</h1>
                    <p className="text-gray-500 font-medium">Gas Management System</p>
                </div>

                <div className="card p-8 border-white/5 backdrop-blur-sm bg-[#161b22]/90">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <label className="form-label">用户名</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input pl-12"
                                    placeholder="请输入您的账号"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label flex justify-between">
                                密码
                                <span className="text-xs text-blue-500 hover:underline cursor-pointer">忘记密码?</span>
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-12 pr-12"
                                    placeholder="请输入您的密码"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-rose-500 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 flex items-center gap-2">
                                <ShieldCheck size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full py-4 text-base font-bold transition-all hover:gap-3"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner w-5 h-5 border-2"></div>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    立即登录系统
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <div className="text-xs text-gray-500 mb-4 font-medium text-center uppercase tracking-widest">快速体验账号</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <button onClick={() => quickLogin('admin', '123456')} className="p-2 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors">管理员 (admin)</button>
                            <button onClick={() => quickLogin('station01', '123456')} className="p-2 bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors">站长 (station01)</button>
                            <button onClick={() => quickLogin('zhao_q', '123456')} className="p-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors">配送员 (zhao_q)</button>
                            <button onClick={() => quickLogin('customer_demo', '123456')} className="p-2 bg-blue-500/5 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors">客户 (customer_demo)</button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-600">
                    &copy; 2024 Gas Management System. All rights reserved.
                </p>
            </div>
        </div>
    );
}
