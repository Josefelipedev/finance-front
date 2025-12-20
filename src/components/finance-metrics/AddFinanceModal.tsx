// src/components/finance-metrics/AddFinanceModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import { CreateFinanceDto, useFinance } from "../../hooks/useFinance.ts";
import { useFinanceCategory } from "../../hooks/useFinanceCategory.ts"; // Importe o hook

interface AddFinanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddFinanceModal: React.FC<AddFinanceModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSuccess
                                                         }) => {
    const [formData, setFormData] = useState<CreateFinanceDto>({
        amount: 0,
        type: 'expense',
        description: '',
        categoryId: undefined,
        iconName: 'pricetag',
        referenceDate: new Date().toISOString().split('T')[0],
    });

    const { addFinanceRecord, isLoading, error, reset } = useFinance();
    const { getAllCategories, data: categories, isLoading: categoriesLoading } = useFinanceCategory();

    // Buscar categorias quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            getAllCategories();
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addFinanceRecord(formData);
            onSuccess?.();

            // Reset form
            reset();
            setFormData({
                amount: 0,
                type: 'expense',
                description: '',
                categoryId: undefined,
                iconName: 'pricetag',
                referenceDate: new Date().toISOString().split('T')[0],
            });

            // Close modal
            onClose();
        } catch (err) {
            console.error('Erro ao adicionar transação:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-md"
        >
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Adicionar Transação
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-200">
                        {error.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Tipo
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Descrição
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descrição da transação"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Categoria
                            </label>
                            <select
                                value={formData.categoryId || ''}
                                onChange={(e) => setFormData({...formData, categoryId: e.target.value ? parseInt(e.target.value) : undefined})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={categoriesLoading}
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {categoriesLoading && (
                                <p className="text-xs text-gray-500 mt-1">Carregando categorias...</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Data da Transação
                            </label>
                            <input
                                type="date"
                                value={formData.referenceDate}
                                onChange={(e) => setFormData({...formData, referenceDate: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Ícone
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['pricetag', 'shopping-cart', 'home', 'car', 'utensils', 'heart', 'graduation-cap', 'plane'].map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({...formData, iconName: icon})}
                                    className={`p-2 rounded-lg border transition-colors ${
                                        formData.iconName === icon
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    <i className={`fas fa-${icon}`}></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Adicionando...
                                </span>
                            ) : (
                                'Adicionar Transação'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddFinanceModal;