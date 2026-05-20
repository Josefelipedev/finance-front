import React, { useState } from 'react';
import { toast } from 'sonner';
import { useShopping, AiGenerateResult } from '../../../hooks/useShopping';

interface AIShoppingModalProps {
  onSuccess: (result: AiGenerateResult) => void;
  onCancel: () => void;
}

const AIShoppingModal: React.FC<AIShoppingModalProps> = ({ onSuccess, onCancel }) => {
  const { generateWithAI, isLoading } = useShopping();

  const [budget, setBudget] = useState('');
  const [preferences, setPreferences] = useState('');
  const [listName, setListName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await generateWithAI({
        budget: budget ? parseFloat(budget) : undefined,
        preferences: preferences.trim() || undefined,
        listName: listName.trim() || undefined,
        currencyCode: 'EUR',
        currencySymbol: '€',
      });

      toast.success(`Lista "${result.list.name}" criada com ${result.list.items.length} itens!`);
      onSuccess(result);
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao gerar lista. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-sky-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-robot text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Gerar Lista com IA
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  A IA analisa seus gastos e monta a lista mais econômica para você
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Orçamento */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <i className="fas fa-wallet text-sky-500 mr-2" />
              Orçamento máximo (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex: 300,00"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sem orçamento, a IA priorizará o máximo de economia possível.
            </p>
          </div>

          {/* Nome da lista */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <i className="fas fa-tag text-sky-500 mr-2" />
              Nome da lista (opcional)
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ex: Compras da semana"
              maxLength={60}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Preferências */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <i className="fas fa-sliders-h text-sky-500 mr-2" />
              Preferências e restrições (opcional)
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Ex: sou vegetariano, prefiro produtos orgânicos, tenho intolerância à lactose, quero focar em proteínas..."
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {preferences.length}/300 caracteres
            </p>
          </div>

          {/* Info box */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="fas fa-info-circle text-purple-500 mt-0.5 shrink-0" />
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <p className="font-semibold mb-1">Como funciona</p>
                <ul className="space-y-0.5 text-purple-600 dark:text-purple-400">
                  <li>• A IA analisa seus últimos 60 dias de gastos</li>
                  <li>• Considera itens que você já costuma comprar</li>
                  <li>• Sugere produtos com melhor custo-benefício</li>
                  <li>• Inclui dicas de economia para cada item</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-sky-500 text-white rounded-lg hover:from-purple-600 hover:to-sky-600 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Gerando lista...
                </>
              ) : (
                <>
                  <i className="fas fa-magic" />
                  Gerar Lista
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIShoppingModal;
