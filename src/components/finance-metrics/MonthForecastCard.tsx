import React from 'react';
import { useForecast } from '../../hooks/useForecast';
import { formatMoney } from '../../utils/currency';
import MixedCurrencyWarning from '../common/MixedCurrencyWarning';

/**
 * "O que me sobra depois de pagar o que falta este mês?"
 *
 * Era a pergunta para que as contas a pagar existem, e não tinha resposta fora
 * do ecrã de Contas (B6 da revisão). O número vem do servidor, do mesmo motor
 * que o resumo do WhatsApp usa — as ocorrências pendentes até ao fim do mês,
 * convertidas antes de somar.
 *
 * É sempre o **mês corrente**, e o cartão di-lo, porque o seletor de período
 * ao lado pode estar noutro intervalo qualquer.
 */
const MonthForecastCard: React.FC = () => {
  const { forecast, isLoading } = useForecast();

  if (isLoading || !forecast) return null;

  const { realized, pending, projectedBalance, displayCurrency } = forecast;
  const semTaxa = forecast.unconvertedCurrencies ?? [];
  const nada = pending.expense === 0 && pending.income === 0;

  // O realizado e o pendente são convertidos em separado: basta um deles ter
  // ficado por converter para o saldo previsto ser uma soma de moedas.
  if (semTaxa.length > 0) return <MixedCurrencyWarning currencies={semTaxa} />;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-white/[0.06] dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            Este mês, até ao fim
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Não segue o período escolhido acima — é sempre o mês corrente
          </p>
        </div>
        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
          {forecast.month}
        </span>
      </div>

      {nada ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Não há contas por pagar nem valores a receber até ao fim do mês. O saldo previsto é o
          realizado: {formatMoney(realized.balance, displayCurrency)}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Realizado</p>
            <p className="font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatMoney(realized.balance, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ainda a pagar</p>
            <p className="font-display text-lg font-semibold tabular-nums text-error-600 dark:text-red-400">
              {formatMoney(pending.expense, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ainda a receber</p>
            <p className="font-display text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
              {formatMoney(pending.income, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sobra prevista</p>
            <p
              className={`font-display text-lg font-semibold tabular-nums ${
                projectedBalance >= 0
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-error-600 dark:text-red-400'
              }`}
            >
              {formatMoney(projectedBalance, displayCurrency)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthForecastCard;
