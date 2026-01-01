// src/components/finance-metrics/categories/CategoryForm.tsx (com fallback)
import React, { useState, useEffect } from 'react';
import { useFinanceCategory, FinanceCategory } from '../../../hooks/useFinanceCategory';
import { useDefaultIcons, IconOption } from '../../../hooks/useDefaultIcons';

interface CategoryFormProps {
  category?: FinanceCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const { createCategory, updateCategory, isLoading } = useFinanceCategory();
  const { icons, loading, getIconForCategory } = useDefaultIcons();
  const [formData, setFormData] = useState({
    name: '',
    iconName: 'fas fa-circle',
    color: '#6B7280',
    description: '',
  });
  const [suggestedIcons, setSuggestedIcons] = useState<IconOption[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [fontAwesomeLoaded, setFontAwesomeLoaded] = useState(false);

  // Verifica se FontAwesome está carregado
  useEffect(() => {
    const checkFontAwesome = () => {
      // Verifica se a classe FontAwesome existe
      const testIcon = document.createElement('i');
      testIcon.className = 'fas fa-check';
      document.body.appendChild(testIcon);

      // Verifica se o estilo foi aplicado
      const isLoaded = window
        .getComputedStyle(testIcon, ':before')
        .getPropertyValue('font-family')
        .includes('Font Awesome');

      document.body.removeChild(testIcon);
      setFontAwesomeLoaded(isLoaded);

      // Se não estiver carregado após 3 segundos, mostra fallback
      if (!isLoaded) {
        setTimeout(() => {
          const recheck = window
            .getComputedStyle(testIcon, ':before')
            .getPropertyValue('font-family')
            .includes('Font Awesome');
          setFontAwesomeLoaded(recheck);
        }, 3000);
      }
    };

    checkFontAwesome();
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        iconName: category.iconName || 'fas fa-circle',
        color: category.color || '#6B7280',
        description: category.description || '',
      });
    }
  }, [category]);

  useEffect(() => {
    const suggestIcons = async () => {
      if (formData.name.length > 2) {
        const suggestions = icons.filter((icon) =>
          icon.keywords.some((keyword) =>
            formData.name.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        setSuggestedIcons(suggestions.slice(0, 6));
      } else {
        setSuggestedIcons([]);
      }
    };

    suggestIcons();
  }, [formData.name, icons]);

  const handleNameChange = async (name: string) => {
    setFormData({ ...formData, name });

    if (!category && name.length > 2) {
      const suggested = await getIconForCategory(name);
      setFormData((prev) => ({
        ...prev,
        name,
        iconName: suggested.icon,
        color: suggested.color,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData = {
        name: formData.name.trim(),
        iconName: formData.iconName,
        color: formData.color,
        description: formData.description.trim(),
        isActive: category?.isActive ?? true,
      };

      if (category) {
        await updateCategory(category.id, categoryData);
      } else {
        await createCategory(categoryData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const filteredIcons =
    activeTab === 'all' ? icons : icons.filter((icon) => icon.group === activeTab);

  // Componente de fallback para ícones
  const IconDisplay = ({ icon, color, label }: { icon: string; color: string; label: string }) => {
    if (!fontAwesomeLoaded) {
      // Fallback: mostra uma div colorida com a primeira letra
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1"
            style={{ backgroundColor: color }}
          >
            {label.charAt(0)}
          </div>
          <span className="text-xs text-center truncate w-full">{label}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <i className={`${icon} text-xl mb-1`} style={{ color }}></i>
        <span className="text-xs text-center truncate w-full">{label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {category ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {!fontAwesomeLoaded && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <i className="fas fa-exclamation-triangle"></i>
                <p className="text-sm">
                  FontAwesome não carregado. Usando fallback visual. Verifique a conexão ou
                  importação.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome da Categoria *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Ex: Alimentação, Salário, Transporte..."
                required
                maxLength={50}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dica: O ícone será sugerido automaticamente baseado no nome
              </p>
            </div>

            {/* Sugestões de Ícones */}
            {suggestedIcons.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sugestões baseadas no nome:
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedIcons.map((icon) => (
                    <button
                      type="button"
                      key={icon.value}
                      onClick={() =>
                        setFormData({ ...formData, iconName: icon.value, color: icon.color })
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        formData.iconName === icon.value
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <IconDisplay icon={icon.value} color={icon.color} label={icon.label} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seletor de Ícones */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Escolha um Ícone
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTab === 'all'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('income')}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTab === 'income'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('expense')}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTab === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Despesas
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4 border rounded-lg dark:border-slate-700 max-h-60 overflow-y-auto">
                  {filteredIcons.map((icon) => (
                    <button
                      type="button"
                      key={icon.value}
                      onClick={() =>
                        setFormData({ ...formData, iconName: icon.value, color: icon.color })
                      }
                      className={`flex flex-col items-center p-2 rounded-lg ${
                        formData.iconName === icon.value
                          ? 'bg-sky-100 dark:bg-sky-900/30 border-2 border-sky-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                      }`}
                      title={icon.label}
                    >
                      <IconDisplay icon={icon.value} color={icon.color} label={icon.label} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pré-visualização */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  {fontAwesomeLoaded ? (
                    <i
                      className={`${formData.iconName} text-2xl`}
                      style={{ color: formData.color }}
                    ></i>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.name.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-800 dark:text-white">
                  {formData.name || 'Nome da Categoria'}
                </p>
                <div className="flex justify-center items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-palette text-slate-500"></i>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 cursor-pointer bg-transparent"
                      title="Escolher cor"
                    />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Cor: <span className="font-mono">{formData.color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Descrição da categoria..."
                rows={3}
                maxLength={200}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : category ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Categoria'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
