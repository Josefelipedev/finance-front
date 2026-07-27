import { useEffect, useState } from 'react';
import TagField from './TagField';
import type {
  MealPreferences,
  PreferenceOptions,
  SavePreferencesBody,
} from '../../hooks/useMealPlanner';

/** Suggestions offered as one-tap chips; the user can type anything else. */
const FAVORITE_SUGGESTIONS = [
  'Frango', 'Atum', 'Ovos', 'Salmão', 'Carne moída', 'Bacalhau',
  'Arroz', 'Massa', 'Batata doce', 'Feijão', 'Grão-de-bico', 'Aveia',
  'Brócolos', 'Cenoura', 'Espinafres', 'Tomate', 'Abacate', 'Banana',
  'Lasanha', 'Feijoada', 'Risoto', 'Tacos', 'Sopa de legumes', 'Omelete',
];

const DISLIKE_SUGGESTIONS = [
  'Beringela', 'Coentros', 'Fígado', 'Cogumelos', 'Azeitonas',
  'Pimento', 'Curgete', 'Peixe com espinhas', 'Picante', 'Queijo azul',
];

// ── Small building blocks ─────────────────────────────────────────────────────

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Menos ${label}`}
          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:border-gray-300 transition"
        >
          −
        </button>
        <span className="w-6 text-center text-base font-semibold text-gray-800 dark:text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Mais ${label}`}
          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:border-gray-300 transition"
        >
          +
        </button>
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={`text-sm px-3 py-2 rounded-lg border transition text-left ${
              selected
                ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function PreferencesPanel({
  initial,
  options,
  saving,
  onSave,
}: {
  initial: MealPreferences | null;
  options: PreferenceOptions | null;
  saving: boolean;
  onSave: (data: SavePreferencesBody) => void;
}) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cuisineStyle, setCuisineStyle] = useState('varied');
  const [dietGoal, setDietGoal] = useState('balanced');
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [mealPrepMode, setMealPrepMode] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setAdults(initial.adults);
    setChildren(initial.children);
    setCuisineStyle(initial.cuisineStyle);
    setDietGoal(initial.dietGoal);
    setFavoriteFoods(initial.favoriteFoods);
    setDislikedFoods(initial.dislikedFoods);
    setMealPrepMode(initial.mealPrepMode);
  }, [initial]);

  // Mirrors the API: a child counts as half an adult portion.
  const servings = Math.max(1, Math.round((adults + children * 0.5) * 2) / 2);

  const submit = () =>
    onSave({ adults, children, cuisineStyle, dietGoal, favoriteFoods, dislikedFoods, mealPrepMode });

  return (
    <div className="space-y-5">
      {/* Casa */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">🏠 Quem come em casa</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          As receitas e a lista de compras são multiplicadas para a casa toda.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Stepper label="Adultos" hint="Porção inteira cada" value={adults} min={1} max={12} onChange={setAdults} />
          <Stepper label="Crianças" hint="Contam como meia porção" value={children} min={0} max={12} onChange={setChildren} />
        </div>

        <div className="mt-3 text-sm rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-4 py-2.5">
          Cada refeição vai render <strong>{servings} {servings === 1 ? 'porção' : 'porções'}</strong>
          {children > 0 && ' — e o cardápio evita picante e sabores fortes por causa das crianças'}.
        </div>
      </section>

      {/* Cozinha */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">🍳 Tipo de comida</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          A tradição culinária do cardápio. "Variada" mistura tudo ao longo da semana.
        </p>
        <OptionGrid options={options?.cuisineStyles ?? []} value={cuisineStyle} onChange={setCuisineStyle} />
      </section>

      {/* Objetivo */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">🎯 Objetivo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Combina com qualquer tipo de comida — dá para pedir italiana <em>e</em> económica.
        </p>
        <OptionGrid options={options?.dietGoals ?? []} value={dietGoal} onChange={setDietGoal} />

        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={mealPrepMode}
            onChange={(e) => setMealPrepMode(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-brand-500"
          />
          <span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo meal prep</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Concentra o cozinhado no domingo e reaproveita as preparações durante a semana.
            </span>
          </span>
        </label>
      </section>

      {/* Gostos */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">⭐ O que você gosta</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Pelo menos metade das refeições da semana vai usar algo desta lista.
        </p>
        <TagField
          items={favoriteFoods}
          suggestions={FAVORITE_SUGGESTIONS}
          placeholder="Ex.: bacalhau, lasanha… e Enter"
          tone="favorite"
          onChange={setFavoriteFoods}
        />

        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mt-6 mb-1">✗ O que você não gosta</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Nunca aparece no cardápio nem na lista de compras.
        </p>
        <TagField
          items={dislikedFoods}
          suggestions={DISLIKE_SUGGESTIONS}
          placeholder="Ex.: beringela… e Enter"
          tone="dislike"
          onChange={setDislikedFoods}
        />
      </section>

      <button
        onClick={submit}
        disabled={saving}
        className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar preferências'}
      </button>
    </div>
  );
}
