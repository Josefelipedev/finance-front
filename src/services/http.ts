import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiResponse } from '../types/api';

export class HttpClient {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // ================= REQUEST =================
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');

        if (token) {
          config.headers?.set('Authorization', `Bearer ${token}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // ================= RESPONSE =================
    this.instance.interceptors.response.use(
      (response) => {
        const apiResponse = response.data as ApiResponse<any>;

        if (!apiResponse.success) {
          return Promise.reject(new Error(apiResponse.message));
        }

        // Retorna apenas o payload
        return apiResponse.data;
      },
      (error: AxiosError<any>) => {
        if (!error.response) {
          return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
        }

        const status = error.response.status;
        const message = (error.response.data as any)?.message || 'Erro inesperado';

        const url = error.config?.url || '';
        const isAuthRoute = url.includes('/auth/');

        // 401 = sessão inválida/expirada → desloga (exceto nas rotas de auth, onde
        // 401 significa "credenciais inválidas" e deve chegar ao catch do form).
        // 403 = sem permissão → NÃO desloga, apenas propaga o erro.
        if (status === 401 && !isAuthRoute) {
          const hadToken = !!localStorage.getItem('token');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (hadToken && !window.location.pathname.startsWith('/signin')) {
            window.location.href = '/signin';
          }
        }

        if (status === 429) {
          return Promise.reject(new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.'));
        }

        return Promise.reject(new Error(message));
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config) as unknown as Promise<T>;
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config) as unknown as Promise<T>;
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config) as unknown as Promise<T>;
  }

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config) as unknown as Promise<T>;
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config) as unknown as Promise<T>;
  }
}
