// src/components/finance-metrics/FinanceGoals.tsx
import React, { useState, useEffect } from 'react';
import { useGoals, Goal } from '../../../hooks/useGoals.ts';
import { useModal } from '../../../hooks/useModal.ts'; // Ajuste o caminho
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
    isError,
    reset,
  } = useGoals();

  // Modais
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  // Estados
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

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

  // Função para abrir modal de edição
  const handleEditClick = (goal: Goal) => {
    setEditingGoal(goal);
    editModal.openModal();
  };

  // Função para abrir modal de exclusão
  const handleDeleteClick = (goal: Goal) => {
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
  const handleMarkAsCompleted = async (goal: Goal) => {
    setIsSubmitting(true);
    try {
      await updateGoal(goal.id, { ...goal, status: 'completed' });
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar metas por tab ativa
  const filteredGoals = goals ? filterGoalsByStatus(goals, activeTab) : [];

  // Cores baseadas no status
  const getGoalColor = (goal: Goal) => {
    if (goal.status === 'completed') return 'bg-green-500';
    if (goal.status === 'cancelled') return 'bg-gray-500';
    if (isGoalOverdue(goal)) return 'bg-red-500';
    return 'bg-blue-500';
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading && !goals) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Metas Financeiras</h3>
          <button
            onClick={createModal.openModal}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nova Meta</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-4">
            {(['active', 'completed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === status
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {status === 'active' && 'Ativas'}
                {status === 'completed' && 'Concluídas'}
                {status === 'cancelled' && 'Canceladas'}
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                  {goals ? filterGoalsByStatus(goals, status).length : 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Lista de Metas */}
        <div className="space-y-6">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-bullseye text-4xl mb-3"></i>
              <p className="font-medium">
                Nenhuma meta {activeTab === 'active' ? 'ativa' : activeTab}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={createModal.openModal}
                  className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
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

              return (
                <div
                  key={goal.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">{goal.name}</h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    {goal.status === 'active' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMarkAsCompleted(goal)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm"
                          title="Marcar como concluída"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          onClick={() => handleEditClick(goal)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(goal)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
                          title="Excluir"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Progresso
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        R$ {goal.currentValue.toLocaleString('pt-BR')} / R${' '}
                        {goal.targetValue.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>{percentage.toFixed(1)}% concluído</span>
                        <span>
                          Falta: R$ {(goal.targetValue - goal.currentValue).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {isOverdue && goal.status === 'active' && (
                        <span className="text-red-500 font-medium">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          Atrasada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <span className="font-medium">Início:</span> {formatDate(goal.startDate)}
                    </div>
                    <div>
                      <span className="font-medium">Término:</span> {formatDate(goal.endDate)}
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
        className="max-lg:4w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
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
        className="max-lg:4w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Editar Meta</h2>
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
        className="max-lg:4w-full max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>
          {deletingGoal && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Tem certeza que deseja excluir a meta <strong>"{deletingGoal.name}"</strong>? Esta
                ação não pode ser desfeita.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Todos os dados relacionados a esta meta serão perdidos.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={deleteModal.closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
