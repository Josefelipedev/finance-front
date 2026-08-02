import React, { useEffect, useState } from 'react';
import { formatAmountInput, parseAmountInput } from '../../utils/money';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  currencySymbol: string;
  error?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Campo de dinheiro.
 *
 * É `type="text"` de propósito: com `type="number"` o browser só aceita ponto
 * decimal e um **1.160,56** escrito à mão virava **1,16**, gravado sem aviso.
 * Aqui o que se escreve é convertido pelo `parseAmountInput`, e ao sair do
 * campo o valor reaparece formatado — para se ver o que ficou registado.
 */
const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currencySymbol,
  error,
  placeholder = '0,00',
  id,
}) => {
  const [display, setDisplay] = useState(() => formatAmountInput(value));
  const [focused, setFocused] = useState(false);

  // Enquanto se escreve, o campo é de quem escreve: só se reformata de fora
  // quando o valor muda sem ser por teclado (abrir o modal para editar).
  useEffect(() => {
    if (!focused) setDisplay(formatAmountInput(value));
  }, [value, focused]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        {currencySymbol}
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setDisplay(formatAmountInput(value));
        }}
        onChange={(e) => {
          setDisplay(e.target.value);
          onChange(parseAmountInput(e.target.value));
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border py-2 pl-10 pr-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${
          error ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
    </div>
  );
};

export default MoneyInput;
