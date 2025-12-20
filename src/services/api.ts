import axios from 'axios';
import { getFinanceApi } from '../utils/get-finance-api';

// ========== CONFIGURAÇÕES GERAIS ==========
const API_BASE_URL = import.meta.env.VITE_BASE_URL_API || 'http://localhost:3000/api';
const FINANCE_BASE_URL = getFinanceApi?.({ isSocket: false }) || 'http://localhost:3001/api';

// ========== INTERCEPTOR DE REQUEST PARA TOKEN ==========
const setAuthHeaders = (config: any) => {
    const token = localStorage.getItem('token');
    const financeToken = localStorage.getItem('financeToken');

    // Configurar token padrão (autenticação)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Configurar token financeiro se for para a API financeira
    if (financeToken && config.baseURL?.includes('finance')) {
        config.headers['X-Finance-Token'] = financeToken;
    }

    return config;
};

// ========== INTERCEPTOR DE ERRO GLOBAL ==========
const handleApiError = (error: any) => {
    if (!error.response) {
        console.error('Erro de rede ou servidor não responde:', error);
        return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
    }

    const { status, data } = error.response;

    switch (status) {
        case 401:
            // Token de autenticação expirado
            localStorage.removeItem('token');
            window.location.href = '/signin';
            break;

        case 403:
            // Acesso proibido - token financeiro pode estar expirado
            if (error.config.baseURL?.includes('finance')) {
                const financeToken = localStorage.getItem('financeToken');
                if (financeToken) {
                    console.warn('Token financeiro pode estar expirado');
                    // Aqui você pode implementar renovação de token financeiro
                }
            }
            break;

        case 429:
            // Rate limiting
            console.warn('Muitas requisições. Aguarde um momento.');
            break;

        case 500:
            console.error('Erro interno do servidor:', data?.message || 'Erro desconhecido');
            break;
    }

    return Promise.reject(error);
};

// ========== INSTÂNCIA DA API PRINCIPAL (AUTENTICAÇÃO) ==========
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Configurar interceptors para API principal
api.interceptors.request.use(setAuthHeaders, (error) => Promise.reject(error));
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se for erro 401 e ainda não tentou refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Tentar refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { token: newToken, refreshToken: newRefreshToken } = response.data;

                    localStorage.setItem('token', newToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    // Reexecutar a requisição original
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError: any) {
                // Refresh falhou - fazer logout
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/signin';
            }
        }

        return handleApiError(error);
    }
);

// ========== INSTÂNCIA DA API FINANCEIRA ==========
const financeApi = axios.create({
    baseURL: FINANCE_BASE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Configurar interceptors para API financeira
financeApi.interceptors.request.use(setAuthHeaders, (error) => Promise.reject(error));
financeApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se for erro 403 (financeiro) e ainda não tentou refresh
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Tentar renovar token financeiro (se sua API tiver endpoint de refresh)
                const financeRefreshToken = localStorage.getItem('financeRefreshToken');
                if (financeRefreshToken) {
                    const response = await axios.post(`${FINANCE_BASE_URL}/auth/refresh-finance`, {
                        refreshToken: financeRefreshToken,
                    });

                    const { financeToken: newFinanceToken, refreshToken: newFinanceRefreshToken } = response.data;

                    localStorage.setItem('financeToken', newFinanceToken);
                    if (newFinanceRefreshToken) {
                        localStorage.setItem('financeRefreshToken', newFinanceRefreshToken);
                    }

                    // Reexecutar a requisição original
                    originalRequest.headers['X-Finance-Token'] = newFinanceToken;
                    return financeApi(originalRequest);
                }
            } catch (refreshError) {
                console.error('Falha ao renovar token financeiro:', refreshError);
            }
        }

        return handleApiError(error);
    }
);

// ========== INSTÂNCIA PARA UPLOAD DE ARQUIVOS ==========
const uploadApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

uploadApi.interceptors.request.use(setAuthHeaders, (error) => Promise.reject(error));
uploadApi.interceptors.response.use(
    (response) => response,
    handleApiError
);

// ========== FUNÇÕES ÚTEIS ==========

/**
 * Limpa todos os tokens de autenticação
 */
const clearAuthTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('financeToken');
    localStorage.removeItem('financeRefreshToken');
    delete api.defaults.headers.common['Authorization'];
    delete financeApi.defaults.headers.common['X-Finance-Token'];
};

/**
 * Configura token de autenticação principal
 */
const setAuthToken = (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Configura token financeiro
 */
const setFinanceToken = (token: string) => {
    localStorage.setItem('financeToken', token);
    financeApi.defaults.headers.common['X-Finance-Token'] = token;
};

/**
 * Verifica se está autenticado
 */
const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
};

/**
 * Verifica se está autenticado na API financeira
 */
const isFinanceAuthenticated = (): boolean => {
    return !!localStorage.getItem('financeToken');
};

/**
 * Obtém informações do usuário do token (se JWT)
 */
const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.userId || payload.sub,
            email: payload.email,
            name: payload.name,
            exp: payload.exp,
            iat: payload.iat,
        };
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
};

// ========== EXPORTAÇÕES ==========
export default api;
export {
    financeApi,
    uploadApi,
    clearAuthTokens,
    setAuthToken,
    setFinanceToken,
    isAuthenticated,
    isFinanceAuthenticated,
    getUserFromToken
};