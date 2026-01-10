import { useState } from 'react';
import {
    ShoppingBag, MapPin, Phone, User,
    CreditCard, CheckCircle2, ShieldCheck, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';

export default function UserOrder() {
    const navigate = useNavigate();
    const [specs, setSpecs] = useState('15kg');
    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState('北京市朝阳区建国路88号');
    const [contactName, setContactName] = useState('陈先生');
    const [contactPhone, setContactPhone] = useState('13800000005');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const prices: Record<string, number> = {
        '5kg': 50,
        '15kg': 120,
        '50kg': 350
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await orderApi.createOrder({
                specs,
                quantity,
                address,
                contact_name: contactName,
                contact_phone: contactPhone
            });
            setSuccess(true);
            setTimeout(() => navigate('/user/orders'), 2000);
        } catch (err: any) {
            alert(err.response?.data?.error || '下单失败');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">订单提交成功！</h2>
                <p className="text-gray-500 max-w-sm">我们的管理员正在为您指派配送员，您可以在“我的订单”中查看实时进度。</p>
                <div className="mt-8 flex gap-4">
                    <button onClick={() => navigate('/user/orders')} className="btn btn-primary">查看订单</button>
                    <button onClick={() => navigate('/user')} className="btn btn-ghost">返回首页</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ShoppingBag className="text-blue-400" />
                    在线购气预约
                </h2>
                <p className="text-sm text-gray-500 mt-1">请核对您的配送信息，确保配送员能准确送达</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="card space-y-6">
                        <div className="form-group">
                            <label className="form-label">钢瓶规格</label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(prices).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSpecs(s)}
                                        className={`p-3 rounded-xl border text-center transition-all ${specs === s
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-gray-800 bg-gray-900/50 text-gray-500 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="text-sm font-bold">{s}</div>
                                        <div className="text-xs opacity-70 mt-1">¥{prices[s]}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">选购数量</label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg border border-gray-800 flex items-center justify-center hover:bg-white/5"
                                >-</button>
                                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                    className="w-10 h-10 rounded-lg border border-gray-800 flex items-center justify-center hover:bg-white/5"
                                >+</button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-800">
                            <div className="form-group">
                                <label className="form-label">配送地址</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        className="input pl-10"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">联系人</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            className="input pl-10"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">联系电话</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            className="input pl-10"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-3">
                            <ShieldCheck size={20} className="text-orange-500 shrink-0" />
                            <p className="text-xs text-orange-200/70 leading-relaxed">
                                安全提示：配送员上门时会进行免费的用气安全检查。如发现软管老化等隐患，请配合整改。
                            </p>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/40 ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '' : `确认下单 · ¥${prices[specs] * quantity}`}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <CreditCard size={18} className="text-blue-400" />
                            费用明细
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>商品单价 ({specs})</span>
                                <span>¥{prices[specs]}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>订购数量</span>
                                <span>×{quantity}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>配送费</span>
                                <span className="text-emerald-500">免运费</span>
                            </div>
                            <div className="pt-3 border-t border-gray-800 flex justify-between font-bold text-white text-lg">
                                <span>总计</span>
                                <span>¥{prices[specs] * quantity}</span>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-500">
                            <Info size={12} />
                            <span>提交订单即表示您已阅读并同意《服务协议》</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

