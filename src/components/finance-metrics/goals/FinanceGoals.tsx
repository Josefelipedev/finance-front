// src/components/finance-metrics/FinanceGoals.tsx
import React, { useState, useEffect } from 'react';
import { useGoals, Goal } from '../../../hooks/useGoals.ts';
import { useModal } from '../../../hooks/useModal.ts';
import GoalForm from './GoalForm.tsx';
import { Modal } from '../../ui/modal';

const FinanceGoals: React.FC = () => {
  const {
    getAllGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    calculateGoalProgress,
    isGoalOverdue,
    filterGoalsByStatus,
    data: goals,
    isLoading,
  } = useGoals();

  // Modais
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  // Estados
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELED'>('ACTIVE');
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [clickAnimation, setClickAnimation] = useState<number | null>(null);

  // Carregar metas ao montar o componente
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      await getAllGoals();
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    }
  };

  // Função para alternar expansão com animação
  const toggleGoalExpansion = (goalId: number) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
    setClickAnimation(goalId);
    setTimeout(() => setClickAnimation(null), 300);
  };

  // Função para abrir modal de edição
  const handleEditClick = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o container
    setEditingGoal(goal);
    editModal.openModal();
  };

  // Função para abrir modal de exclusão
  const handleDeleteClick = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o container
    setDeletingGoal(goal);
    deleteModal.openModal();
  };

  // Função para criar meta
  const handleCreateGoal = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createGoal(data);
      createModal.closeModal();
      fetchGoals();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para atualizar meta
  const handleUpdateGoal = async (data: any) => {
    console.log('Updating goal with data:', data);
    if (!editingGoal) return;

    setIsSubmitting(true);
    try {
      await updateGoal(editingGoal.id, data);
      editModal.closeModal();
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir meta
  const handleConfirmDelete = async () => {
    if (!deletingGoal) return;

    setIsSubmitting(true);
    try {
      await deleteGoal(deletingGoal.id);
      deleteModal.closeModal();
      setDeletingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para marcar meta como concluída
  const handleMarkAsCompleted = async (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o container
    setIsSubmitting(true);
    try {
      await updateGoal(goal.id, { ...goal, status: 'COMPLETED' });
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar metas por tab ativa
  const filteredGoals = filterGoalsByStatus(activeTab);

  // Cores baseadas no status - COM AZUL MAIS CLARO
  const getGoalColor = (goal: Goal) => {
    if (goal.status === 'COMPLETED') return 'bg-emerald-500'; // Verde mais suave
    if (goal.status === 'CANCELED') return 'bg-slate-400'; // Cinza mais claro
    if (isGoalOverdue(goal)) return 'bg-rose-500'; // Vermelho mais suave
    return 'bg-sky-500'; // Azul mais claro (sky blue)
  };

  // Cores para o texto do status
  const getStatusTextColor = (goal: Goal) => {
    if (goal.status === 'COMPLETED') return 'text-emerald-600 dark:text-emerald-400';
    if (goal.status === 'CANCELED') return 'text-slate-500 dark:text-slate-400';
    if (isGoalOverdue(goal)) return 'text-rose-600 dark:text-rose-400';
    return 'text-sky-600 dark:text-sky-400';
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading && !goals) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Metas Financeiras
          </h3>
          <button
            onClick={createModal.openModal}
            disabled={isSubmitting}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 active:scale-95 shadow-sm"
          >
            <i className="fas fa-plus"></i>
            <span>Nova Meta</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
          <nav className="-mb-px flex space-x-4">
            {(['ACTIVE', 'COMPLETED', 'CANCELED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === status
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }
                `}
              >
                {status === 'ACTIVE' && 'Ativas'}
                {status === 'COMPLETED' && 'Concluídas'}
                {status === 'CANCELED' && 'Canceladas'}
                <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">
                  {filterGoalsByStatus(status).length ?? 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Lista de Metas */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <i className="fas fa-bullseye text-4xl mb-3"></i>
              <p className="font-medium">
                Nenhuma meta {activeTab === 'ACTIVE' ? 'ativa' : activeTab}
              </p>
              {activeTab === 'ACTIVE' && (
                <button
                  onClick={createModal.openModal}
                  className="mt-2 text-sky-600 hover:text-sky-700 dark:text-sky-400 transition-colors"
                >
                  Crie sua primeira meta
                </button>
              )}
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const percentage = calculateGoalProgress(goal);
              const isOverdue = isGoalOverdue(goal);
              const colorClass = getGoalColor(goal);
              const statusTextColor = getStatusTextColor(goal);
              const isExpanded = expandedGoalId === goal.id;
              const isAnimating = clickAnimation === goal.id;

              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoalExpansion(goal.id)}
                  className={`
                    p-4 border border-slate-200 dark:border-slate-700 rounded-lg 
                    transition-all duration-300 cursor-pointer
                    ${isExpanded ? 'shadow-md border-sky-200 dark:border-sky-700' : 'hover:shadow-sm'}
                    ${isAnimating ? 'scale-[0.995]' : ''}
                    bg-white dark:bg-slate-800
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-slate-800 dark:text-white">{goal.name}</h4>
                        <span
                          className={`
                          text-xs px-2 py-0.5 rounded-full font-medium
                          ${goal.status === 'ACTIVE' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : ''}
                          ${goal.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : ''}
                          ${goal.status === 'CANCELED' ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : ''}
                        `}
                        >
                          {goal.status === 'ACTIVE' && 'Ativa'}
                          {goal.status === 'COMPLETED' && 'Concluída'}
                          {goal.status === 'CANCELED' && 'Cancelada'}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    {goal.status === 'ACTIVE' && (
                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleMarkAsCompleted(goal, e)}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-sm p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          title="Marcar como concluída"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          onClick={(e) => handleEditClick(goal, e)}
                          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 text-sm p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(goal, e)}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-sm p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title="Excluir"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <button
                          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 text-sm p-2 transition-transform duration-300"
                          title={isExpanded ? 'Recolher' : 'Expandir'}
                        >
                          <i
                            className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          ></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Progresso
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        R$ {goal.currentValue.toLocaleString('pt-BR')} / R${' '}
                        {goal.targetValue.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} transition-all duration-700 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{percentage.toFixed(1)}% concluído</span>
                        <span>
                          Falta: R$ {(goal.targetValue - goal.currentValue).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {isOverdue && goal.status === 'ACTIVE' && (
                        <span className="text-rose-500 font-medium flex items-center">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          Atrasada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seção Expandida */}
                  <div
                    className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}
                  `}
                  >
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                      {/* Datas */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <i className="fas fa-calendar-plus mr-1"></i>
                            Início
                          </p>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {formatDate(goal.startDate)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <i className="fas fa-calendar-check mr-1"></i>
                            Término
                          </p>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {formatDate(goal.endDate)}
                          </p>
                        </div>
                      </div>

                      {/* Informações adicionais */}
                      {goal.category && (
                        <div className="space-y-1 mb-4">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <i className="fas fa-tag mr-1"></i>
                            Categoria
                          </p>
                          <span className="inline-block px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-medium rounded-full">
                            {goal.category}
                          </span>
                        </div>
                      )}

                      {/* Botões de ação rápida */}
                      {goal.status === 'ACTIVE' && (
                        <div className="flex space-x-2 pt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsCompleted(goal, e);
                            }}
                            className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <i className="fas fa-check-circle"></i>
                            <span>Concluir Meta</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(goal, e);
                            }}
                            className="flex-1 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <i className="fas fa-edit"></i>
                            <span>Editar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé (sempre visível) */}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-calendar-alt text-slate-400"></i>
                      <span>Criada em: {formatDate(goal.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                      <span className={`font-medium ${statusTextColor}`}>
                        {goal.status === 'ACTIVE'
                          ? 'Em andamento'
                          : goal.status === 'COMPLETED'
                            ? 'Concluída'
                            : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        className="max-lg:w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Nova Meta Financeira
          </h2>
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={createModal.closeModal}
            isLoading={isSubmitting}
          />
        </div>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        className="max-lg:w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Editar Meta</h2>
          {editingGoal && (
            <GoalForm
              initialData={editingGoal}
              onSubmit={handleUpdateGoal}
              onCancel={editModal.closeModal}
              isLoading={isSubmitting}
            />
          )}
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-lg:w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>
          {deletingGoal && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Tem certeza que deseja excluir a meta <strong>"{deletingGoal.name}"</strong>? Esta
                ação não pode ser desfeita.
              </p>

              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <div className="flex items-center text-rose-600 dark:text-rose-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                  Todos os dados relacionados a esta meta serão perdidos.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={deleteModal.closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default FinanceGoals;
