
// src/types/finance.ts
export interface CreateFinanceDto {
    amount: number;
    type: 'income' | 'expense';
    description?: string;
    categoryId?: number;
    iconName?: string;
    referenceDate?: string;
}

export interface FinanceRecord {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string | null;
    iconName: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
    categoryId: number | null;
    referenceDate: string | null;
    category?: {
        id: number;
        name: string;
        color?: string;
    };
}

export interface FinanceSummary {
    totalGanhos: number;
    totalDespesas: number;
    saldo: number;
}

export interface DashboardData {
    totalBalance: number;
    totalExpense: number;
    stats: {
        revenueLastWeek: number;
        foodLastWeek: number;
    };
    transactions: Array<{
        id: string;
        title: string;
        date: string;
        time: string;
        tag: 'income' | 'expense';
        amount: number;
    }>;
}

export interface QueryParams {
    startDate?: string;
    endDate?: string;
}

export interface Category {
    id: number;
    name: string;
    color?: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

export interface RecurringTransaction {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string | null;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextOccurrence: string;
    userId: number;
    categoryId: number | null;
}

export interface FinanceAnalysis {
    message: string;
    insights: string[];
    recommendations: string[];
}