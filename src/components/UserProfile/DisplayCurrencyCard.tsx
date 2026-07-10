// src/components/UserProfile/DisplayCurrencyCard.tsx
// Moeda de exibição: os totais do app são convertidos para ela (cada membro
// do casal pode escolher a sua — ex.: esposa vê em R$, marido em €).
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../hooks/useUserProfile';
import { CURRENCY_OPTIONS, currencyOption } from '../../utils/currency';

const DisplayCurrencyCard: React.FC = () => {
  const { profile, getProfile, updateProfile, isLoading } = useUserProfile();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const current = currencyOption(profile?.currency);

  const handleChange = async (code: string) => {
    setSaving(true);
    try {
      await updateProfile({ currency: code });
      await getProfile();
      toast.success(`Moeda de exibição alterada para ${code}.`);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível alterar a moeda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.06] dark:bg-gray-800 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
            <i className="fas fa-coins"></i>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Moeda de exibição
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Os totais do app são convertidos para esta moeda (câmbio BCE diário). Lançamentos
              mantêm a moeda original.
            </p>
          </div>
        </div>
        <select
          value={current.code}
          disabled={saving || isLoading}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-60 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code} — {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DisplayCurrencyCard;
