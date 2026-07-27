import { useState } from 'react';

const inputClass =
  'text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 ' +
  'text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500';

/** Chip list with free text entry, shared by the preferences tab and the questionnaire. */
function TagField({
  items,
  suggestions,
  placeholder,
  tone,
  onChange,
}: {
  items: string[];
  suggestions: string[];
  placeholder: string;
  tone: 'favorite' | 'dislike';
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const value = raw.trim();
    if (value && !items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft('');
  };
  const remove = (value: string) => onChange(items.filter((i) => i !== value));

  const chip =
    tone === 'favorite'
      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
      : 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${chip}`}>
            {item}
            <button type="button" onClick={() => remove(item)} aria-label={`Remover ${item}`} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-gray-400">Nada adicionado ainda.</span>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={() => add(draft)}
          className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Adicionar
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions
          .filter((s) => !items.some((i) => i.toLowerCase() === s.toLowerCase()))
          .slice(0, 12)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

export default TagField;
