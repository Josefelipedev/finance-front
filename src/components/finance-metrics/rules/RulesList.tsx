import { useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import { Modal } from '../../ui/modal';
import { useConfirm } from '../../ui/confirm/useConfirm';
import MoneyInput from '../../form/MoneyInput';
import { BUCKETS, BUCKET_SHORT } from './buckets';
import type {
  RuleCheck,
  RuleInput,
  RuleKind,
  RuleStatus,
  StoredRule,
} from '../../../hooks/useRules';

/** O que cada família pergunta, e como se escreve o alvo dela. */
const FAMILIES: {
  kind: RuleKind;
  name: string;
  question: string;
  /** O que vem depois do número no formulário. */
  suffix: 'pct' | 'months' | 'money';
  defaultTarget: number;
}[] = [
  {
    kind: 'ceiling',
    name: 'Tecto',
    question: 'Isto não pode passar de uma fatia do que entra.',
    suffix: 'pct',
    defaultTarget: 30,
  },
  {
    kind: 'reserve',
    name: 'Reserva de emergência',
    question: 'Quantos meses de despesa quero ter guardados.',
    suffix: 'months',
    defaultTarget: 6,
  },
  {
    kind: 'savings_rate',
    name: 'Taxa de poupança',
    question: 'Que fatia do que entra quero poupar, sem dizer como divido o resto.',
    suffix: 'pct',
    defaultTarget: 20,
  },
  {
    kind: 'pay_yourself_first',
    name: 'Pagar-me primeiro',
    question: 'Quanto vai para a poupança antes de eu gastar.',
    suffix: 'money',
    defaultTarget: 200,
  },
];

const STATUS_STYLE: Record<RuleStatus, { dot: string; text: string; word: string }> = {
  ok: {
    dot: 'bg-success-500',
    text: 'text-success-600 dark:text-success-400',
    word: 'Cumprida',
  },
  close: {
    dot: 'bg-warning-400',
    text: 'text-warning-700 dark:text-warning-400',
    word: 'Por um triz',
  },
  broken: {
    dot: 'bg-error-500',
    text: 'text-error-600 dark:text-error-400',
    word: 'Quebrada',
  },
  unknown: {
    dot: 'bg-gray-300 dark:bg-gray-600',
    text: 'text-gray-500 dark:text-gray-400',
    word: 'Sem dados',
  },
};

/** O ponto colorido + a palavra. Usado aqui e no cartão do Dashboard. */
export function StatusBadge({ status }: { status: RuleStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.word}
    </span>
  );
}

export function RuleCheckLine({ check }: { check: RuleCheck }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-gray-900 first-letter:uppercase dark:text-white">
        {check.label}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{check.message}</p>
    </div>
  );
}

/**
 * As regras que não são a divisão em três.
 *
 * A divisão em três é uma só e divide **todo** o rendimento. Estas vigiam um
 * número cada, são quantas se quiser, e podem contradizer-se sem ficarem
 * inválidas — um tecto de 30% na habitação vive dentro de um alvo de 50% nas
 * necessidades, e é por caber lá dentro que vale a pena ter as duas.
 *
 * Desligar não é apagar: uma regra em pausa continua a ser uma decisão tomada,
 * e voltar a ligá-la não devia obrigar a reescrevê-la.
 */
export default function RulesList({
  rules,
  currency,
  isSaving,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rules: StoredRule[];
  currency: string;
  isSaving: boolean;
  onCreate: (input: RuleInput) => Promise<unknown>;
  onUpdate: (id: number, input: RuleInput) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const { confirm, dialog } = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<RuleKind>('ceiling');
  const [target, setTarget] = useState(30);
  const [bucket, setBucket] = useState<string>('needs');

  const family = FAMILIES.find((f) => f.kind === kind)!;

  const openForm = (nextKind: RuleKind) => {
    const next = FAMILIES.find((f) => f.kind === nextKind)!;
    setKind(nextKind);
    setTarget(next.defaultTarget);
    setBucket('needs');
    setFormOpen(true);
  };

  const submit = async () => {
    await onCreate({
      kind,
      target,
      // Só o tecto vigia alguma coisa em particular; as outras olham para o
      // total, e mandar-lhes um balde faz o servidor recusar (e bem).
      bucket: kind === 'ceiling' ? bucket : undefined,
    });
    setFormOpen(false);
  };

  return (
    <Surface className="p-4 sm:p-5">
      {dialog}
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          As tuas outras regras
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {rules.length === 0
            ? 'nenhuma ainda'
            : `${rules.filter((r) => r.check?.status === 'ok').length} de ${rules.filter((r) => r.isActive).length} cumpridas`}
        </span>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        A divisão em três reparte tudo o que entra. Estas vigiam um número cada, e
        podem ser quantas quiseres.
      </p>

      {rules.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                {rule.check ? (
                  <RuleCheckLine check={rule.check} />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Em pausa — não está a ser avaliada.
                  </p>
                )}
              </span>
              {rule.check && <StatusBadge status={rule.check.status} />}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void onUpdate(rule.id, { isActive: !rule.isActive })}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {rule.isActive ? 'Pausar' : 'Retomar'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Apagar esta regra?',
                      message:
                        'A regra deixa de ser avaliada e não fica guardada em lado nenhum. Se só a queres calar por uns tempos, "Pausar" mantém-na escrita.',
                      confirmText: 'Apagar',
                      danger: true,
                    });
                    if (ok) void onDelete(rule.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-error-500 hover:text-error-600 disabled:opacity-50 dark:text-error-400"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {FAMILIES.map((f) => (
          <button
            key={f.kind}
            type="button"
            disabled={isSaving}
            onClick={() => openForm(f.kind)}
            className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-400/50 dark:hover:text-brand-400"
          >
            + {f.name}
          </button>
        ))}
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} className="max-w-md p-6">
        <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
          {family.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{family.question}</p>

        {kind === 'ceiling' && (
          <div className="mt-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">O que é que isto vigia?</span>
            <div className="mt-1.5 flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              {BUCKETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  aria-pressed={bucket === b}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    bucket === b
                      ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-white/[0.08] dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {BUCKET_SHORT[b]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm text-gray-700 dark:text-gray-300" htmlFor="rule-target">
            {family.suffix === 'pct'
              ? 'Percentagem do que entra'
              : family.suffix === 'months'
                ? 'Meses de despesa'
                : 'Valor por mês'}
          </label>
          {family.suffix === 'money' ? (
            <div className="mt-1.5">
              <MoneyInput
                id="rule-target"
                value={target}
                onChange={setTarget}
                currencySymbol={currency}
              />
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="rule-target"
                type="number"
                min={1}
                max={family.suffix === 'pct' ? 100 : 120}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-28 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {family.suffix === 'pct' ? '%' : target === 1 ? 'mês' : 'meses'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" type="button" onClick={() => setFormOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" type="button" disabled={isSaving || target <= 0} onClick={() => void submit()}>
            Guardar regra
          </Button>
        </div>
      </Modal>
    </Surface>
  );
}
