import React, { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/plugins/monthSelect/style.css';

interface DateFieldProps {
  /** `date` guarda "AAAA-MM-DD"; `month` guarda "AAAA-MM". */
  mode?: 'date' | 'month';
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
}

/**
 * Campo de data com calendário, em português.
 *
 * Os `<input type="date">` nativos mostram a ordem do **locale do browser**:
 * num Chrome em inglês aparecem como `mm/dd/yyyy`, e quem escreve 11/04/2027 a
 * pensar em 11 de abril grava **4 de novembro** sem nunca perceber. E o
 * `type="month"`, além de ter suporte irregular, dava um campo com aspeto
 * diferente do da data ao lado.
 *
 * O flatpickr já era dependência do projeto: guarda-se sempre o formato ISO
 * (que é o que a API espera) e mostra-se `dd/mm/aaaa` — o `altInput` separa as
 * duas coisas, que é a razão de o campo nativo não servir.
 */
const DateField: React.FC<DateFieldProps> = ({
  mode = 'date',
  value,
  onChange,
  placeholder,
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceRef = useRef<flatpickr.Instance | null>(null);
  // O onChange muda a cada render do pai; guardá-lo numa ref evita recriar o
  // calendário (e perder o que está aberto) a cada tecla no resto do formulário.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;

    const isMonth = mode === 'month';
    const picker = flatpickr(inputRef.current, {
      locale: Portuguese,
      dateFormat: isMonth ? 'Y-m' : 'Y-m-d',
      altInput: true,
      altFormat: isMonth ? 'F \\d\\e Y' : 'd/m/Y',
      altInputClass:
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white',
      allowInput: true,
      plugins: isMonth
        ? [monthSelectPlugin({ shorthand: false, dateFormat: 'Y-m', altFormat: 'F \\d\\e Y' })]
        : [],
      onChange: (_dates, dateStr) => onChangeRef.current(dateStr),
    });
    instanceRef.current = picker;

    return () => {
      picker.destroy();
      instanceRef.current = null;
    };
  }, [mode]);

  // Valor vindo de fora (abrir o modal para editar, ou limpar).
  useEffect(() => {
    const picker = instanceRef.current;
    if (!picker) return;
    if (value) picker.setDate(value, false);
    else picker.clear(false);
  }, [value]);

  return (
    <div className="relative">
      <input ref={inputRef} id={id} placeholder={placeholder} className="hidden" />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Limpar data"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default DateField;
