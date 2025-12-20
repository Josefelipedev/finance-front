// src/components/finance-metrics/FinanceGoals.tsx
import React, { useState } from 'react';

const FinanceGoals: React.FC = () => {
    const [goals, setGoals] = useState([
        { id: 1, title: 'Reserva de Emergência', target: 10000, current: 7500, color: 'bg-blue-500' },
        { id: 2, title: 'Férias', target: 5000, current: 3200, color: 'bg-green-500' },
        { id: 3, title: 'Carro Novo', target: 30000, current: 12500, color: 'bg-purple-500' },
    ]);

    const [newGoal, setNewGoal] = useState({ title: '', target: 0 });

    const addGoal = () => {
        if (newGoal.title && newGoal.target > 0) {
            setGoals([
                ...goals,
                {
                    id: goals.length + 1,
                    title: newGoal.title,
                    target: newGoal.target,
                    current: 0,
                    color: `bg-${['blue', 'green', 'purple', 'yellow', 'pink'][goals.length % 5]}-500`,
                },
            ]);
            setNewGoal({ title: '', target: 0 });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Metas Financeiras
                </h3>
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            <div className="space-y-4">
                {goals.map((goal) => {
                    const percentage = Math.min(100, (goal.current / goal.target) * 100);

                    return (
                        <div key={goal.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {goal.title}
                </span>
                                <span className="font-semibold text-gray-800 dark:text-white">
                  R$ {goal.current.toLocaleString()} / R$ {goal.target.toLocaleString()}
                </span>
                            </div>

                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${goal.color} transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{percentage.toFixed(1)}% concluído</span>
                                <span>Falta: R$ {(goal.target - goal.current).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        placeholder="Nova meta..."
                        className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                        type="number"
                        value={newGoal.target || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })}
                        placeholder="R$"
                        className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                        onClick={addGoal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinanceGoals;