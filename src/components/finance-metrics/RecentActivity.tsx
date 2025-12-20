// src/components/finance-metrics/RecentActivity.tsx
import React, { useEffect, useState } from 'react';
import { useFinance, FinanceRecord } from "../../hooks/useFinance.ts";

interface RecentActivityProps {
    limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 5 }) => {
    const { getAllFinances, isLoading } = useFinance();
    const [activities, setActivities] = useState<FinanceRecord[]>([]);

    useEffect(() => {
        const loadActivities = async () => {
            const data = await getAllFinances();
            if (data) {
                setActivities(data.slice(0, limit));
            }
        };
        loadActivities();
    }, []);

    const getTypeIcon = (type: string) => {
        return type === 'income' ? 'arrow-up' : 'arrow-down';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Atividade Recente
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Ver todas
                </button>
            </div>

            <div className="space-y-3">
                {activities.length > 0 ? (
                    activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <div className="flex items-center">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    activity.type === 'income'
                                        ? 'bg-green-100 dark:bg-green-900'
                                        : 'bg-red-100 dark:bg-red-900'
                                }`}>
                                    <i className={`fas fa-${getTypeIcon(activity.type)} ${
                                        activity.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }`}></i>
                                </div>

                                <div className="ml-3">
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {activity.description || 'Sem descrição'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(activity.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className={`font-semibold ${
                                activity.type === 'income'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {activity.type === 'income' ? '+' : '-'}R$ {activity.amount.toFixed(2)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Nenhuma atividade recente
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;