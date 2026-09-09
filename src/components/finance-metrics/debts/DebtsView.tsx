import { useCallback, useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useConfirm } from '../../ui/confirm/useConfirm';
import { formatMoney } from '../../../utils/currency';
import { useDebts, type Debt, type DebtPayment } from '../../../hooks/useDebts';
import PayoffPlanCard from './PayoffPlanCard';
import PayDebtModal from './PayDebtModal';
import ImportDebtsCard from './ImportDebtsCard';
import DebtForm from './DebtForm';
import { KIND_ICON, KIND_LABEL } from './kinds';

/** Uma dívida na lista: o que falta, o caminho andado, e o que fazer com ela. */
function DebtCard({
  debt,
  isSaving,
  onPay,
  onEdit,
  onDelete,
  onOpenHistory,
}: {
  debt: Debt;
  isSaving?: boolean;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenHistory: () => void;
}) {
  const money = (v: number) => formatMoney(v, debt.currency);
  const liquidada = debt.status === 'PAID';

  return (
    <Surface className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            liquidada
              ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
              : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'
          }`}
        >
          <i className={`fas ${liquidada ? 'fa-check' : KIND_ICON[debt.kind]}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h4 className="truncate font-medium text-gray-900 dark:text-white">
              {debt.name}
            </h4>
            <span className="tabular-nums font-semibold text-gray-900 dark:text-white">
              {money(debt.currentBalance)}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {KIND_LABEL[debt.kind]}
            {debt.annualInterestRate > 0 && ` · ${debt.annualInterestRate}% ao ano`}
            {debt.minimumPayment > 0 && ` · mínimo ${money(debt.minimumPayment)}`}
            {debt.dueDay ? ` · vence dia ${debt.dueDay}` : ''}
          </p>

          {/* A barra conta o caminho andado — o saldo sozinho nunca o conta. */}
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full ${liquidada ? 'bg-success-500' : 'bg-brand-400'}`}
              style={{ width: `${debt.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {liquidada ? (
              <span className="text-success-600 dark:text-success-400">
                Liquidada. Foram {money(debt.amountPaid)}.
              </span>
            ) : (
              <>
                Já pagaste {money(debt.amountPaid)} de {money(debt.originalAmount)} (
                {Math.round(debt.progress)}%)
              </>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {!liquidada && (
              <Button type="button" size="sm" disabled={isSaving} onClick={onPay}>
                Pagar
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={onEdit}
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isSaving}
              onClick={onOpenHistory}
            >
              Histórico
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isSaving}
              onClick={onDelete}
            >
              Apagar
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}

/**
 * As dívidas e o plano de sair delas.
 *
 * O plano fica em cima da lista de propósito: a pergunta que traz alguém a
 * este ecrã é "quando é que isto acaba?", não "quanto devo em cada uma" — essa
 * já se sabe, e é a que faz desistir.
 */
export default function DebtsView() {
  const {
    debts,
    plan,
    isLoading,
    isSaving,
    error,
    load,
    createDebt,
    updateDebt,
    deleteDebt,
    payDebt,
    getPayments,
    undoPayment,
    savePlan,
    getCandidates,
    importDebt,
  } = useDebts();

  const { confirm, dialog } = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | undefined>();
  const [paying, setPaying] = useState<Debt | undefined>();
  const [history, setHistory] = useState<{ debt: Debt; payments: DebtPayment[] } | null>(
    null,
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const openHistory = useCallback(
    async (debt: Debt) => {
      const payments = await getPayments(debt.id).catch(() => []);
      setHistory({ debt, payments: payments ?? [] });
    },
    [getPayments],
  );

  const activas = debts.filter((d) => d.status === 'ACTIVE');
  const arrumadas = debts.filter((d) => d.status !== 'ACTIVE');

  if (isLoading && !plan) return <LoadingSpinner />;

  if (error && !plan) {
    return (
      <Surface className="p-5">
        <p className="text-sm text-error-600 dark:text-error-400">
          Não foi possível carregar as dívidas. {error.message}
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-5">
      {plan && (
        <PayoffPlanCard
          plan={plan}
          isSaving={isSaving}
          onSave={(input) => savePlan(input)}
        />
      )}

      <ImportDebtsCard
        isSaving={isSaving}
        getCandidates={getCandidates}
        onImport={importDebt}
        refreshKey={debts.length}
      />

      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          As dívidas
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          Adicionar
        </Button>
      </div>

      {activas.length === 0 && arrumadas.length === 0 ? (
        <Surface className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma dívida registada. Se não tens nenhuma, este ecrã não é para
            ti — e isso é uma boa notícia.
          </p>
        </Surface>
      ) : (
        <div className="space-y-3">
          {activas.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              isSaving={isSaving}
              onPay={() => setPaying(d)}
              onEdit={() => {
                setEditing(d);
                setFormOpen(true);
              }}
              onOpenHistory={() => void openHistory(d)}
              onDelete={async () => {
                const ok = await confirm({
                  title: 'Apagar a dívida?',
                  message: `«${d.name}» sai do plano. Os lançamentos dos pagamentos ficam — é dinheiro que saiu de facto, e apagar a dívida não o traz de volta.`,
                  danger: true,
                  confirmText: 'Apagar',
                });
                if (ok) await deleteDebt(d.id);
              }}
            />
          ))}

          {arrumadas.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Já não pesam
              </p>
              <div className="space-y-3">
                {arrumadas.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    isSaving={isSaving}
                    onPay={() => setPaying(d)}
                    onEdit={() => {
                      setEditing(d);
                      setFormOpen(true);
                    }}
                    onOpenHistory={() => void openHistory(d)}
                    onDelete={async () => {
                      const ok = await confirm({
                        title: 'Apagar a dívida?',
                        message: `«${d.name}» desaparece da lista. Os lançamentos dos pagamentos ficam.`,
                        danger: true,
                        confirmText: 'Apagar',
                      });
                      if (ok) await deleteDebt(d.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Criar / editar ────────────────────────────────────────────── */}
      {formOpen && (
        <Modal isOpen onClose={() => setFormOpen(false)} className="max-w-xl">
          <div className="p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? 'Editar dívida' : 'Nova dívida'}
            </h3>
            <DebtForm
              initial={editing}
              isSaving={isSaving}
              onCancel={() => setFormOpen(false)}
              onSubmit={async (data) => {
                if (editing) await updateDebt(editing.id, data);
                else await createDebt(data);
                setFormOpen(false);
              }}
            />
          </div>
        </Modal>
      )}

      {/* ── Pagar ─────────────────────────────────────────────────────── */}
      {paying && (
        <PayDebtModal
          debt={paying}
          isSaving={isSaving}
          onClose={() => setPaying(undefined)}
          onPay={async (input) => {
            await payDebt(paying.id, input);
            setPaying(undefined);
          }}
        />
      )}

      {/* ── Histórico ─────────────────────────────────────────────────── */}
      {history && (
        <Modal isOpen onClose={() => setHistory(null)} className="max-w-lg">
          <div className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Pagamentos de «{history.debt.name}»
            </h3>
            {history.payments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Ainda não há pagamentos registados.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
                {history.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="tabular-nums font-medium text-gray-900 dark:text-white">
                        {formatMoney(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {/*
                          `createdAt` é um INSTANTE, não um dia civil: aqui o
                          `formatCivilDate` seria o erro, não a correção — a
                          hora a que se pagou deve mesmo aparecer no relógio de
                          quem lê.
                        */}
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        {p.interestPortion > 0.005 && (
                          <>
                            {' · '}
                            {formatMoney(p.interestPortion, p.currency)} foram juro
                          </>
                        )}
                        {p.financeId == null && ' · fora do livro-razão'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Desfazer o pagamento?',
                          message:
                            'O saldo da dívida recupera o CAPITAL que este pagamento abateu — o juro que tinha corrido não se desfaz, porque correu mesmo.' +
                            (p.financeAutoCreated && p.financeId
                              ? ' O lançamento criado por nós é apagado.'
                              : ''),
                          danger: true,
                          confirmText: 'Desfazer',
                        });
                        if (!ok) return;
                        await undoPayment(history.debt.id, p.id);
                        setHistory(null);
                      }}
                    >
                      Desfazer
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}
