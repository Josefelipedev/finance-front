// src/components/ui/DateRangePicker.tsx
import React, { useState } from 'react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
                                                                    startDate,
                                                                    endDate,
                                                                    onChange,
                                                                    className = '',
                                                                }) => {
    const [isOpen, setIsOpen] = useState(false);

    const quickRanges = [
        { label: 'Hoje', days: 0 },
        { label: 'Ontem', days: 1 },
        { label: 'Últimos 7 dias', days: 7 },
        { label: 'Últimos 30 dias', days: 30 },
        { label: 'Este mês', days: 'current-month' },
        { label: 'Mês anterior', days: 'prev-month' },
    ];

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const handleQuickRange = (days: number | string) => {
        const end = new Date();
        let start = new Date();

        if (typeof days === 'number') {
            start.setDate(start.getDate() - days);
        } else if (days === 'current-month') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        } else if (days === 'prev-month') {
            const prevMonth = new Date(end.getFullYear(), end.getMonth() - 1, 1);
            start = prevMonth;
            end.setDate(0); // Último dia do mês anterior
        }

        onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <i className="fas fa-calendar-alt text-gray-500 dark:text-gray-400"></i>
                <span className="text-sm font-medium">
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs`}></i>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-[200px]">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Intervalos Rápidos
                            </p>
                            {quickRanges.map((range) => (
                                <button
                                    key={range.label}
                                    onClick={() => handleQuickRange(range.days)}
                                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Personalizado
                            </p>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        De
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => onChange(e.target.value, endDate)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Até
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => onChange(startDate, e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};