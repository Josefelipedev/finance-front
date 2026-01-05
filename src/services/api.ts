import { HttpClient } from './http';
import { getFinanceApi } from '../utils/get-finance-api';

const API_BASE_URL = getFinanceApi?.({ isSocket: false }) || 'http://localhost:3001/api';

const api = new HttpClient({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default api;
