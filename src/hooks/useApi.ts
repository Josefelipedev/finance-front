import { useState, useCallback } from 'react';
import api, { financeApi } from '../services/api';
import { ApiResponse } from '../types/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

interface UseApiState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useApi<T = any>(apiInstance: 'default' | 'finance' = 'default') {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const getClient = () => {
    switch (apiInstance) {
      case 'finance':
        return financeApi;
      default:
        return api;
    }
  };

  const execute = useCallback(
    async <D = any>(
      method: 'get' | 'post' | 'put' | 'patch' | 'delete',
      url: string,
      data?: any,
      options?: UseApiOptions<D>
    ): Promise<D> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      try {
        const client = getClient();
        const response = await client<ApiResponse<D>>({
          method,
          url,
          data,
        });

        const responseData = response.data.data as D;

        setState({
          data: responseData,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        options?.onSuccess?.(responseData);
        return responseData;
      } catch (error: any) {
        const apiError = error.response?.data?.message || error.message || 'Erro na requisição';

        setState({
          data: null,
          error: new Error(apiError),
          isLoading: false,
          isSuccess: false,
          isError: true,
        });

        options?.onError?.(error);
        throw error;
      } finally {
        options?.onFinally?.();
      }
    },
    [apiInstance]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,

    // Métodos curtos para conveniência
    get: <D = any>(url: string, options?: UseApiOptions<D>) =>
      execute<D>('get', url, undefined, options),

    post: <D = any>(url: string, data?: any, options?: UseApiOptions<D>) =>
      execute<D>('post', url, data, options),

    put: <D = any>(url: string, data?: any, options?: UseApiOptions<D>) =>
      execute<D>('put', url, data, options),

    patch: <D = any>(url: string, data?: any, options?: UseApiOptions<D>) =>
      execute<D>('patch', url, data, options),

    del: <D = any>(url: string, options?: UseApiOptions<D>) =>
      execute<D>('delete', url, undefined, options),
  };
}
