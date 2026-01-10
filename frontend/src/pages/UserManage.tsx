import { useState, useEffect } from 'react';
import {
    UserPlus, Search,
    Shield, Edit3, Trash2, Phone
} from 'lucide-react';
import { userApi } from '../services/api';
import type { User } from '../types/index';

export default function UserManage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user' as User['role'],
        real_name: '',
        phone: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userApi.getUsers();
            setUsers(res.data);
        } catch (err) {
            console.error('获取用户列表失败', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await userApi.createUser(formData);
            setShowModal(false);
            setFormData({
                username: '',
                password: '',
                role: 'user',
                real_name: '',
                phone: ''
            });
            fetchUsers();
        } catch (err) {
            alert('创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要注销此用户吗？操作不可逆。')) return;
        try {
            await userApi.deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert('删除失败');
        }
    };

    const roleBadges: Record<string, { label: string; class: string }> = {
        admin: { label: '管理员', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        station: { label: '站长', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
        delivery: { label: '配送员', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        user: { label: '普通用户', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">系统用户管理</h2>
                    <p className="text-sm text-gray-500 mt-1">管理系统各角色账号权限与基本资料</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary shadow-lg shadow-blue-500/20"
                >
                    <UserPlus size={18} />
                    新增系统用户
                </button>
            </div>

            <div className="card mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input type="text" placeholder="搜索用户名/真实姓名/手机号..." className="input pl-10" />
                </div>
                <select className="select w-auto">
                    <option value="">所有角色</option>
                    <option value="admin">管理员</option>
                    <option value="station">站长</option>
                    <option value="delivery">配送员</option>
                    <option value="user">普通用户</option>
                </select>
                <button className="btn btn-ghost hover:bg-blue-500/10 hover:text-blue-400">查询</button>
            </div>

            <div className="card p-0 overflow-hidden border-[#30363d] bg-[#161b22]">
                <table className="table">
                    <thead>
                        <tr className="bg-[#0d1117]">
                            <th className="pl-6">用户信息</th>
                            <th>系统角色</th>
                            <th>关联站点</th>
                            <th>联系方式</th>
                            <th>创建时间</th>
                            <th className="pr-6 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-24"><div className="loading-spinner mx-auto border-blue-500"></div></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-24 text-gray-600 font-medium">暂无用户记录</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#1f242c] transition-colors group">
                                    <td className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shadow-inner">
                                                {(user.real_name?.[0] || user.username[0]).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-100">{user.real_name || '未填真实姓名'}</div>
                                                <div className="text-xs text-gray-500 font-mono italic">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadges[user.role]?.class}`}>
                                            {roleBadges[user.role]?.label}
                                        </span>
                                    </td>
                                    <td className="text-gray-400 text-sm">
                                        {user.station_id ? `第 ${user.station_id} 站点` : '-'}
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <Phone size={10} className="text-gray-500" /> {user.phone || '未关联手机'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs text-gray-500">
                                        {user.created_at?.split('T')[0]}
                                    </td>
                                    <td className="pr-6">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Edit3 size={16} /></button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg border border-[#30363d] shadow-2xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserPlus size={20} className="text-blue-500" />
                                新增系统账号
                            </h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500">✕</button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label font-bold text-gray-300">用户名</label>
                                    <input
                                        className="input"
                                        placeholder="用于系统登录"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label font-bold text-gray-300">初始密码</label>
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="请输入密码"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label font-bold text-gray-300">系统角色权限</label>
                                <select
                                    className="select"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                                >
                                    <option value="user">普通用户</option>
                                    <option value="delivery">配送员 (核心业务角色)</option>
                                    <option value="station">站长 (站点管理角色)</option>
                                    <option value="admin">系统管理员</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label font-bold text-gray-300">真实姓名</label>
                                    <input
                                        className="input"
                                        placeholder="选填"
                                        value={formData.real_name}
                                        onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label font-bold text-gray-300">手机号码</label>
                                    <input
                                        className="input"
                                        placeholder="用于接收配送任务"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                                <Shield className="text-indigo-400 shrink-0" size={20} />
                                <p className="text-xs text-indigo-300/70 leading-relaxed">
                                    提示：新创建的账号初始状态即为活跃。请确保为其分配正确的岗位权限，以符合最小授权原则。
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost px-8">取消</button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary px-10 ${submitting ? 'btn-loading' : ''}`}
                                    disabled={submitting}
                                >
                                    确认创建
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

