import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
    };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('前端渲染异常', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
                <div className="w-full max-w-lg card text-center space-y-4">
                    <div className="text-2xl font-bold text-white">页面出现异常</div>
                    <p className="text-sm text-gray-400 leading-6">
                        已拦截这次前端错误，避免系统直接白屏。你可以先尝试重新渲染当前页面，若仍异常再刷新浏览器。
                    </p>
                    <div className="flex justify-center gap-3">
                        <button onClick={this.handleReset} className="btn btn-primary">
                            重新加载页面
                        </button>
                        <button onClick={() => window.location.reload()} className="btn btn-ghost">
                            刷新浏览器
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
