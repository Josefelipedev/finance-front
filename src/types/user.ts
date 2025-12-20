export interface User {
    id: number;
    email: string;
    name: string;
    displayName: string;
    phone: string;
    profilePicUrl: string;
    whatsapp: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
    createdAt?: Date;
    updatedAt?: Date;
    hasPassword?: boolean;
}

export interface UserResponse {
    success: boolean;
    data?: {
        token: string;
        user: User;
    };
    user?: User;
    token?: string;
}