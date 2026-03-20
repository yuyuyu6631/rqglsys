export interface ApiErrorShape {
    code?: string;
    message?: string;
    response?: {
        status?: number;
        data?: {
            error?: string;
            message?: string;
        };
    };
}

export function getErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as ApiErrorShape | undefined;
    const message = apiError?.response?.data?.error || apiError?.response?.data?.message || apiError?.message;

    if (!message) {
        return fallback;
    }

    if (message === 'Network Error') {
        return '网络连接失败，请检查前后端服务是否正常启动';
    }

    if (apiError?.code === 'ECONNABORTED') {
        return '请求超时，请稍后重试';
    }

    return message;
}
