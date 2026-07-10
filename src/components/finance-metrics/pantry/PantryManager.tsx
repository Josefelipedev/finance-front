// src/components/finance-metrics/pantry/PantryManager.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePantry, PantryItem, UpsertPantryDto } from '../../../hooks/usePantry';
import { Modal } from '../../ui/modal';
import BarcodeScanModal from './BarcodeScanModal';
import Button from '../../ui/button/Button';

const emptyForm: UpsertPantryDto = {
  name: '',
  quantity: undefined,
  unit: '',
  category: '',
  expiresAt: undefined,
};

const PantryManager: React.FC = () => {
  const { data: items, isLoading, error, getAll, upsert, update, remove } = usePantry();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [form, setForm] = useState<UpsertPantryDto>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [deleting, setDeleting] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);

  useEffect(() => {
    getAll().catch(() => {});
  }, []);

  const openCreate = (prefillName?: string) => {
    setEditing(null);
    setForm({ ...emptyForm, name: prefillName ?? '' });
    setIsFormOpen(true);
  };

  const openEdit = (item: PantryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit ?? '',
      category: item.category ?? '',
      expiresAt: item.expiresAt ? item.expiresAt.split('T')[0] : undefined,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Informe o nome do item.');
      return;
    }

    const payload: UpsertPantryDto = {
      name: form.name.trim(),
      quantity: form.quantity != null && !Number.isNaN(form.quantity) ? Number(form.quantity) : undefined,
      unit: form.unit?.trim() || undefined,
      category: form.category?.trim() || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    setIsSaving(true);
    try {
      if (editing) {
        await update(editing.id, payload);
        toast.success('Item atualizado com sucesso!');
      } else {
        await upsert(payload);
        toast.success('Item adicionado à despensa!');
      }
      setIsFormOpen(false);
      setEditing(null);
    } catch {
      toast.error('Erro ao salvar item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await remove(deleting.id);
      toast.success('Item removido da despensa!');
      setDeleting(null);
    } catch {
      toast.error('Erro ao remover item.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isExpiringSoon = (iso?: string | null) => {
    if (!iso) return false;
    const days = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
        <div className="flex gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
              Erro ao carregar a despensa
            </h3>
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Despensa</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Controle os itens que você tem em casa e acompanhe validades
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            type="button"
            onClick={() => setIsBarcodeOpen(true)}
            startIcon={<i className="fas fa-barcode"></i>}
            className="w-full sm:w-auto"
          >
            Escanear
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => openCreate()}
            startIcon={<i className="fas fa-plus"></i>}
            className="w-full sm:w-auto"
          >
            Novo Item
          </Button>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <i className="fas fa-box-open text-4xl mb-3 opacity-40"></i>
          <p>Sua despensa está vazia. Adicione o primeiro item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">{item.name}</h3>
                  {item.category && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                    aria-label="Editar"
                  >
                    <i className="fas fa-pen text-sm"></i>
                  </button>
                  <button
                    onClick={() => setDeleting(item)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label="Remover"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {item.quantity != null ? item.quantity : '—'} {item.unit || ''}
                </span>
                {item.expiresAt && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isExpiringSoon(item.expiresAt)
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <i className="far fa-clock mr-1"></i>
                    {new Date(item.expiresAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {editing ? 'Editar Item' : 'Novo Item'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex.: Arroz"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                value={form.quantity ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quantity: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unidade
              </label>
              <input
                type="text"
                value={form.unit ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="kg, un, L..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={form.category ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ex.: Grãos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Validade
              </label>
              <input
                type="date"
                value={form.expiresAt ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Salvando...
                </span>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} className="max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>
          {deleting && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Tem certeza que deseja remover <strong>"{deleting.name}"</strong> da despensa?
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setDeleting(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      Removendo...
                    </span>
                  ) : (
                    'Remover'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Barcode scan */}
      <BarcodeScanModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onDetected={(code) => openCreate(code)}
      />
    </div>
  );
};

export default PantryManager;
