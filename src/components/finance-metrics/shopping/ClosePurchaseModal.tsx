import React, { useMemo, useState } from 'react';
import { ShoppingList } from '../../../hooks/useShopping';
import { formatMoney } from '../../../utils/currency';
import CategorySelect from '../../form/CategorySelect';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';
import DateField from '../../form/DateField';
import { todayCivil } from '../../../utils/civil-date';
import {
  lineTotal,
  lineCurrency,
  isEstimatedPrice,
  isStalePrice,
  scrapedAgeInDays,
} from '../../../utils/shopping-price';
import { convertAmount, unconvertibleCurrencies } from '../../../utils/currency';
import { useExchangeRates } from '../../../hooks/useExchangeRates';

interface ClosePurchaseModalProps {
  list: ShoppingList;
  /** Moeda em que a despesa vai ser criada (a do perfil). */
  currency?: string | null;
  isSaving?: boolean;
  onConfirm: (payload: { categoryId?: number; referenceDate: string }) => void;
  onCancel: () => void;
}

const today = () => todayCivil();

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

  /*
    Uma linha paga pelo preço do scraper está na moeda da LOJA. O servidor
    converte-a antes de gravar a despesa; se aqui se somasse o número cru, o
    ecrã prometia 0,15 € e o extrato mostrava outro valor.
  */
  const rates = useExchangeRates();
  const semCambio = useMemo(
    () => unconvertibleCurrencies(purchased.map((i) => lineCurrency(i, currency)), currency, rates),
    [purchased, currency, rates]
  );
  const total = useMemo(
    () =>
      purchased.reduce(
        (sum, i) => sum + convertAmount(lineTotal(i), lineCurrency(i, currency), currency, rates),
        0
      ),
    [purchased, currency, rates]
  );
  const convertidos = useMemo(
    () => purchased.filter((i) => (lineCurrency(i, currency) ?? currency) !== currency),
    [purchased, currency]
  );
  const velhos = useMemo(() => purchased.filter((i) => isStalePrice(i)), [purchased]);

  // Parte do total pode não ser dinheiro que a pessoa confirmou: é o preço que
  // a loja tinha no site quando os preços foram actualizados. Vale dizê-lo
  // ANTES de a despesa existir, não depois de a ver no extrato.
  const estimados = useMemo(() => purchased.filter(isEstimatedPrice), [purchased]);

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
        ) : semCambio.length > 0 ? (
          <div className="mt-5 rounded-lg border border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 p-4">
            <p className="text-sm text-warning-700 dark:text-warning-400">
              Há preços em {semCambio.join(', ')} e não temos câmbio para {currency} neste momento —
              o total ficaria errado. Tente daqui a pouco.
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
              {estimados.length > 0 && (
                <p className="text-xs text-warning-600 dark:text-warning-400 mt-2">
                  {estimados.length === 1
                    ? `O preço de "${estimados[0].name}" é o da loja, não um que tenha escrito.`
                    : `${estimados.length} itens entram com o preço da loja, não com um que tenha escrito.`}{' '}
                  Escreva o preço que pagou se quiser que a despesa seja exata.
                </p>
              )}
              {velhos.length > 0 && (
                <p className="text-xs text-warning-600 dark:text-warning-400 mt-2">
                  {velhos.length === 1
                    ? `O preço de "${velhos[0].name}" foi lido na loja há ${scrapedAgeInDays(velhos[0])} dias`
                    : `${velhos.length} desses preços foram lidos na loja há mais de uma semana`}{' '}
                  — actualize-os se quiser o valor de hoje.
                </p>
              )}
              {convertidos.length > 0 && semCambio.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {convertidos.length === 1 ? 'Um preço vem' : `${convertidos.length} preços vêm`} em{' '}
                  {[...new Set(convertidos.map((i) => i.scrapedCurrency))].join(', ')} e{' '}
                  {convertidos.length === 1 ? 'foi convertido' : 'foram convertidos'} para {currency}.
                </p>
              )}
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
            disabled={isSaving || semItens || semPreco || semCambio.length > 0}
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
