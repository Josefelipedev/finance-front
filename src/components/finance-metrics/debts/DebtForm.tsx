import React, { useEffect, useState } from 'react';
import MoneyInput from '../../form/MoneyInput';
import Button from '../../ui/button/Button';
import { CURRENCY_OPTIONS, currencyOption } from '../../../utils/currency';
import { useUserProfile } from '../../../hooks/useUserProfile';
import type { Debt, DebtInput, DebtKind } from '../../../hooks/useDebts';
import { KIND_OPTIONS } from './kinds';

interface Props {
  initial?: Debt;
  onSubmit: (data: DebtInput) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

export default function DebtForm({ initial, onSubmit, onCancel, isSaving }: Props) {
  const { profile, getProfile } = useUserProfile();
  const [form, setForm] = useState<DebtInput>({
    name: '',
    kind: 'OTHER',
    currentBalance: 0,
    originalAmount: 0,
    annualInterestRate: 0,
    minimumPayment: 0,
    dueDay: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        kind: initial.kind,
        currency: initial.currency,
        currentBalance: initial.currentBalance,
        originalAmount: initial.originalAmount,
        annualInterestRate: initial.annualInterestRate,
        minimumPayment: initial.minimumPayment,
        dueDay: initial.dueDay,
      });
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && profile?.currency) {
      setForm((prev) => (prev.currency ? prev : { ...prev, currency: profile.currency }));
    }
  }, [initial, profile?.currency]);

  // A moeda é da DÍVIDA, não de quem olha: o símbolo ao lado do valor tem de
  // ser aquele em que o saldo baixa. É a mesma lição do ecrã das metas.
  const symbol = currencyOption(form.currency ?? profile?.currency).symbol;

  // Uma dívida já com pagamentos não muda de moeda — o servidor recusa, e
  // desligar aqui evita mandar a pessoa preencher para levar um 400.
  const moedaTrancada = !!initial && initial.amountPaid > 0.005;

  const set = <K extends keyof DebtInput>(key: K, value: DebtInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key as string]: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'A dívida precisa de um nome';
    if (!(form.currentBalance > 0)) next.currentBalance = 'Quanto se deve hoje?';
    if (form.dueDay != null && (form.dueDay < 1 || form.dueDay > 31)) {
      next.dueDay = 'Entre 1 e 31';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    await onSubmit({
      ...form,
      // Sem original escrito, o original é o que se deve hoje: a dívida entra
      // no ponto em que está, e a barra começa a zero em vez de inventar um
      // passado que ninguém contou.
      originalAmount:
        form.originalAmount && form.originalAmount > 0
          ? form.originalAmount
          : form.currentBalance,
      dueDay: form.dueDay || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nome *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex.: Cartão do banco, Crédito do carro"
          className={`${INPUT} ${errors.name ? 'border-error-500' : ''}`}
        />
        {errors.name && <p className="mt-1 text-xs text-error-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo
          </label>
          <select
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as DebtKind)}
            className={INPUT}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Moeda
          </label>
          <select
            value={form.currency ?? profile?.currency ?? 'BRL'}
            disabled={moedaTrancada}
            onChange={(e) => set('currency', e.target.value)}
            className={`${INPUT} disabled:opacity-60`}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          {moedaTrancada && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Já há pagamentos em {initial?.currency}. Trocar agora reetiquetava
              dinheiro que já saiu.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quanto se deve hoje *
          </label>
          <MoneyInput
            value={form.currentBalance}
            onChange={(v) => set('currentBalance', v)}
            currencySymbol={symbol}
            error={!!errors.currentBalance}
          />
          {errors.currentBalance && (
            <p className="mt-1 text-xs text-error-500">{errors.currentBalance}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quanto era no início
          </label>
          <MoneyInput
            value={form.originalAmount ?? 0}
            onChange={(v) => set('originalAmount', v)}
            currencySymbol={symbol}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Só serve para a barra mostrar o caminho já andado. Em branco, vale o
            saldo de hoje.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Juro anual (%)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.annualInterestRate ?? 0}
            onChange={(e) => set('annualInterestRate', Number(e.target.value) || 0)}
            className={INPUT}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ao ANO, como vem no contrato — não ao mês.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mínimo por mês
          </label>
          <MoneyInput
            value={form.minimumPayment ?? 0}
            onChange={(v) => set('minimumPayment', v)}
            currencySymbol={symbol}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dia de vencimento
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={form.dueDay ?? ''}
            onChange={(e) =>
              set('dueDay', e.target.value === '' ? null : Number(e.target.value))
            }
            className={`${INPUT} ${errors.dueDay ? 'border-error-500' : ''}`}
          />
          {errors.dueDay && <p className="mt-1 text-xs text-error-500">{errors.dueDay}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          {initial ? 'Guardar' : 'Adicionar dívida'}
        </Button>
      </div>
    </form>
  );
}
