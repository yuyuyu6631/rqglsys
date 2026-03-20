import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ClipboardCheck, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safetyApi } from '../services/api';
import { getErrorMessage } from '../utils/apiError';

const checkItems = [
    { id: 'valve', label: '燃气阀门是否严密' },
    { id: 'hose', label: '软管是否存在老化或龟裂' },
    { id: 'leak', label: '连接处是否存在漏气风险' },
    { id: 'vent', label: '通风环境是否良好' },
    { id: 'warning', label: '安全警示是否完整可见' },
];

export default function SafetyCheck() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [level, setLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<Record<string, boolean | null>>(
        Object.fromEntries(checkItems.map((item) => [item.id, null])),
    );

    const completedCount = useMemo(
        () => Object.values(results).filter((value) => value !== null).length,
        [results],
    );

    const setItemResult = (id: string, passed: boolean) => {
        setResults((prev) => ({ ...prev, [id]: passed }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (completedCount !== checkItems.length) {
            alert('请先完成全部检查项');
            return;
        }

        setLoading(true);
        try {
            const uploadedPhotos: string[] = [];
            for (const file of files) {
                const res = await safetyApi.uploadPhoto(file);
                uploadedPhotos.push(res.data.filename);
            }

            await safetyApi.createRecord({
                order_id: orderId ? Number(orderId) : undefined,
                check_items: JSON.stringify(results),
                hazard_level: level,
                hazard_description: description,
                photos: uploadedPhotos,
            });

            setSuccess(true);
            setTimeout(() => navigate('/delivery'), 1500);
        } catch (err: unknown) {
            alert(getErrorMessage(err, '提交安检失败'));
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
                <h2 className="text-2xl font-bold text-white mb-2">安检记录提交成功</h2>
                <p className="text-gray-500">记录已同步到后台，正在返回配送任务页</p>
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
                <p className="text-sm text-gray-500 mt-1">
                    {orderId ? `当前关联订单 ID: ${orderId}` : '未关联订单，提交后会记录为独立安检记录'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-200 mb-2">检查项</h3>
                    {checkItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-gray-800">
                            <span className="text-sm text-gray-300">{item.label}</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setItemResult(item.id, true)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                        results[item.id] === true
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}
                                >
                                    合格
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setItemResult(item.id, false)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                        results[item.id] === false
                                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                            : 'bg-gray-800 text-gray-400 border-gray-700'
                                    }`}
                                >
                                    不合格
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="text-xs text-gray-500">已完成 {completedCount} / {checkItems.length} 项</div>
                </div>

                <div className="card space-y-4">
                    <h3 className="font-bold text-gray-200 mb-2">隐患判定</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: 'none', label: '无隐患', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
                            { id: 'low', label: '低风险', activeClass: 'border-blue-500 bg-blue-500/10 text-blue-400' },
                            { id: 'medium', label: '中风险', activeClass: 'border-orange-500 bg-orange-500/10 text-orange-400' },
                            { id: 'high', label: '高风险', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-400' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setLevel(item.id as 'none' | 'low' | 'medium' | 'high')}
                                className={`p-3 rounded-xl border text-center transition-all ${
                                    level === item.id ? item.activeClass : 'border-gray-800 bg-gray-900/50 text-gray-500'
                                }`}
                            >
                                <div className="text-xs font-bold">{item.label}</div>
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="input min-h-[100px] mt-4"
                        placeholder="隐患描述，如有请填写"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="card">
                    <h3 className="font-bold text-gray-200 mb-4">现场取证照片</h3>
                    <label className="flex gap-4 cursor-pointer">
                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all">
                            <Camera size={24} />
                            <span className="text-[10px] mt-1">选择照片</span>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                        <div className="flex-1 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 self-center">
                            <Info size={16} className="text-blue-400 shrink-0" />
                            <div className="text-[10px] text-blue-300/70 leading-relaxed">
                                <div>建议拍摄钢瓶连接处、软管、阀门和周围环境。</div>
                                <div className="mt-1">已选择 {files.length} 张照片。</div>
                            </div>
                        </div>
                    </label>
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
