// src/components/finance-metrics/QuickSummary.tsx
import React, { useEffect, useState } from 'react';
import { useFinance } from "../../hooks/useFinance.ts";

const QuickSummary: React.FC = () => {
    const { getFinanceSummary, isLoading } = useFinance();
    const [summary, setSummary] = useState<{
        totalGanhos: number;
        totalDespesas: number;
        saldo: number;
    } | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            const data = await getFinanceSummary();
            setSummary(data);
        };
        loadSummary();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const savingsRate = summary.totalGanhos > 0
        ? ((summary.saldo / summary.totalGanhos) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Resumo Rápido
            </h3>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
                            R$ {summary.totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Receitas</div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <div className="text-red-600 dark:text-red-400 font-semibold text-lg">
                            R$ {summary.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Despesas</div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className={`font-semibold text-lg ${
                        summary.saldo >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                    }`}>
                        R$ {summary.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Saldo Atual</div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Economia</span>
                        <span className={`text-sm font-semibold ${
                            parseFloat(savingsRate) >= 20
                                ? 'text-green-600 dark:text-green-400'
                                : parseFloat(savingsRate) >= 10
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                        }`}>
              {savingsRate}%
            </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{
                                width: `${Math.min(100, Math.max(0, parseFloat(savingsRate)))}%`
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSummary;