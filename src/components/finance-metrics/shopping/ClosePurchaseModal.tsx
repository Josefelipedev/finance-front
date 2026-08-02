import React, { useMemo, useState } from 'react';
import { ShoppingList } from '../../../hooks/useShopping';
import { formatMoney } from '../../../utils/currency';
import CategorySelect from '../../form/CategorySelect';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';
import DateField from '../../form/DateField';

interface ClosePurchaseModalProps {
  list: ShoppingList;
  /** Moeda em que a despesa vai ser criada (a do perfil). */
  currency?: string | null;
  isSaving?: boolean;
  onConfirm: (payload: { categoryId?: number; referenceDate: string }) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Confirmação do fecho da compra.
 *
 * Mostra exatamente o que vai ser lançado — o total dos itens COMPRADOS, pela
 * mesma regra do servidor (preço do scraper quando existe, senão o escrito à
 * mão) — para que ninguém descubra o valor só depois de a despesa existir.
 */
const ClosePurchaseModal: React.FC<ClosePurchaseModalProps> = ({
  list,
  currency,
  isSaving = false,
  onConfirm,
  onCancel,
}) => {
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [referenceDate, setReferenceDate] = useState(today());

  const purchased = useMemo(() => list.items.filter((i) => i.purchased), [list.items]);
  const total = useMemo(
    () => purchased.reduce((sum, i) => sum + (i.scrapedPrice ?? i.price ?? 0), 0),
    [purchased]
  );

  const semItens = purchased.length === 0;
  const semPreco = !semItens && total <= 0;

  return (
    <Modal isOpen onClose={onCancel} className="max-w-md">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Fechar compra</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Os itens comprados de <strong>{list.name}</strong> passam a ser uma despesa.
        </p>

        {semItens ? (
          <div className="mt-5 rounded-lg border border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 p-4">
            <p className="text-sm text-warning-700 dark:text-warning-400">
              Nenhum item está marcado como comprado. Marque o que levou para casa antes de fechar a
              compra.
            </p>
          </div>
        ) : semPreco ? (
          <div className="mt-5 rounded-lg border border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 p-4">
            <p className="text-sm text-warning-700 dark:text-warning-400">
              Os itens comprados não têm preço. Preencha os preços (ou actualize-os) antes de fechar
              a compra.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Despesa a criar</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatMoney(total, currency)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {purchased.length} de {list.items.length}{' '}
                {list.items.length === 1 ? 'item' : 'itens'} — os não marcados ficam de fora.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <CategorySelect
                  value={categoryId}
                  onChange={setCategoryId}
                  type="expense"
                  placeholder="Supermercado (padrão)"
                />
              </div>

              <div>
                <label
                  htmlFor="close-purchase-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Dia da compra
                </label>
                <DateField
                  id="close-purchase-date"
                  value={referenceDate}
                  onChange={setReferenceDate}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              A lista fica bloqueada depois de fechada. Reabrir apaga a despesa criada.
            </p>
          </>
        )}

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={isSaving || semItens || semPreco}
            onClick={() => onConfirm({ categoryId, referenceDate })}
          >
            {isSaving ? 'A fechar...' : 'Fechar compra'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ClosePurchaseModal;
