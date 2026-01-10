import { useState } from 'react';
import {
    ClipboardCheck, Camera,
    CheckCircle2, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SafetyCheck() {
    const navigate = useNavigate();
    const [level, setLevel] = useState('none');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const checkItems = [
        { id: 'valve', label: '燃气阀门是否严密' },
        { id: 'hose', label: '软管是否存在老化/龟裂' },
        { id: 'leak', label: '连接处是否存在漏气' },
        { id: 'vent', label: '通风情况是否良好' },
        { id: 'warning', label: '安全警示贴是否完好' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // 模拟提交
        setTimeout(() => {
            setSuccess(true);
            setTimeout(() => navigate('/delivery'), 2000);
        }, 1500);
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">安检纪录提交成功</h2>
                <p className="text-gray-500">感谢您的细致检查，安全是我们的底线。</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ClipboardCheck className="text-blue-400" />
                    入户安全检查表
                </h2>
                <p className="text-sm text-gray-500 mt-1">请逐项核实用户用气环境，发现隐患请如实上报</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-200 mb-2">必检项点</h3>
                    {checkItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-gray-800">
                            <span className="text-sm text-gray-300">{item.label}</span>
                            <div className="flex gap-2">
                                <button type="button" className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20">合格</button>
                                <button type="button" className="px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-xs font-bold">不合格</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-200 mb-2">隐患判定</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: 'none', label: '无隐患', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
                            { id: 'low', label: '低风险', activeClass: 'border-blue-500 bg-blue-500/10 text-blue-400' },
                            { id: 'medium', label: '中风险', activeClass: 'border-orange-500 bg-orange-500/10 text-orange-400' },
                            { id: 'high', label: '高风险', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-400' }
                        ].map((l) => (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => setLevel(l.id)}
                                className={`p-3 rounded-xl border text-center transition-all ${level === l.id
                                    ? l.activeClass
                                    : 'border-gray-800 bg-gray-900/50 text-gray-500'
                                    }`}
                            >
                                <div className="text-xs font-bold">{l.label}</div>
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="input min-h-[100px] mt-4"
                        placeholder="隐患描述 (如有)..."
                    ></textarea>
                </div>

                <div className="card">
                    <h3 className="font-bold text-gray-200 mb-4">现场取证面</h3>
                    <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-all">
                            <Camera size={24} />
                            <span className="text-[10px] mt-1">拍摄照片</span>
                        </div>
                        <div className="flex-1 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 self-center">
                            <Info size={16} className="text-blue-400 shrink-0" />
                            <p className="text-[10px] text-blue-300/70 leading-relaxed">
                                请拍摄包含“钢瓶连接处”及“周围环境”的照片，照片中需清晰显示检查日期。
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className={`btn btn-primary w-full py-4 text-lg font-bold ${loading ? 'btn-loading' : ''}`}
                    disabled={loading}
                >
                    {loading ? '' : '提交安检结果'}
                </button>
            </form>
        </div>
    );
}
