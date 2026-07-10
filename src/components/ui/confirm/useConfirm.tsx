import { useCallback, useState } from 'react';
import { Modal } from '../modal';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Estilo destrutivo (vermelho) para ações como excluir. */
  danger?: boolean;
}

/**
 * Confirmação padronizada (sobre o Modal compartilhado), no lugar de window.confirm.
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (await confirm({ message: 'Excluir?', danger: true })) { ... }
 *   ...
 *   return (<>{conteúdo}{dialog}</>);
 */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const close = (result: boolean) => {
    resolver?.(result);
    setResolver(null);
    setOpts(null);
  };

  const dialog = opts ? (
    <Modal isOpen onClose={() => close(false)} className="max-w-sm" showCloseButton={false}>
      <div className="p-6">
        {opts.title && (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {opts.title}
          </h3>
        )}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{opts.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {opts.cancelText ?? 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              opts.danger
                ? 'bg-error-500 text-white hover:bg-error-600'
                : 'bg-brand-400 text-gray-950 hover:bg-brand-300'
            }`}
          >
            {opts.confirmText ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  ) : null;

  return { confirm, dialog };
}
