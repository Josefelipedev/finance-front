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

        // 🔐 NÃO AUTORIZADO ou PROIBIDO
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/signin';
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

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config) as unknown as Promise<T>;
  }
}
