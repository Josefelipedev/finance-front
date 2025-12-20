// Tipos para respostas da API
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
    timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Tipos para requisições de autenticação
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone: string;
}

export interface VerifyCodeRequest {
    phone: string;
    code: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
}

// Tipos para respostas de autenticação
export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        name: string;
        displayName?: string;
        profilePicUrl?: string;
        emailVerified?: boolean;
        firstName?: string;
        lastName?: string;
        phone?: string;
    };
}


// Erros da API
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}