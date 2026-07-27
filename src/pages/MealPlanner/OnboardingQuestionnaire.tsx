import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import Button from '../../components/ui/button/Button';
import TagField from './TagField';
import type { PreferenceOptions, SavePreferencesBody } from '../../hooks/useMealPlanner';

/**
 * Four quick questions shown once, so the very first menu already reflects the
 * household and what the user actually likes to eat. Everything set here stays
 * editable afterwards in the preferences tab.
 */

const PROTEIN_CHOICES = ['Frango', 'Carne de vaca', 'Carne de porco', 'Peixe', 'Bacalhau', 'Atum', 'Ovos', 'Leguminosas'];
const CARB_CHOICES = ['Arroz', 'Massa', 'Batata', 'Batata doce', 'Pão integral', 'Aveia', 'Cuscuz', 'Quinoa'];
const VEGGIE_CHOICES = ['Brócolos', 'Cenoura', 'Espinafres', 'Tomate', 'Alface', 'Courgette', 'Feijão verde', 'Pimento'];

function MultiChips({
  choices,
  selected,
  onToggle,
}: {
  choices: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const active = selected.includes(choice);
        return (
          <button
            key={choice}
            type="button"
            onClick={() => onToggle(choice)}
            aria-pressed={active}
            className={`text-sm px-3 py-1.5 rounded-full border transition ${
              active
                ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingQuestionnaire({
  isOpen,
  options,
  saving,
  onFinish,
  onSkip,
}: {
  isOpen: boolean;
  options: PreferenceOptions | null;
  saving: boolean;
  onFinish: (data: SavePreferencesBody) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cuisineStyle, setCuisineStyle] = useState('varied');
  const [proteins, setProteins] = useState<string[]>([]);
  const [carbs, setCarbs] = useState<string[]>([]);
  const [veggies, setVeggies] = useState<string[]>([]);
  const [dishes, setDishes] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const finish = () =>
    onFinish({
      adults,
      children,
      cuisineStyle,
      favoriteFoods: [...proteins, ...carbs, ...veggies, ...dishes],
      markOnboarded: true,
    });

  const steps = [
    {
      title: 'Quem come em casa?',
      hint: 'Serve para multiplicar as receitas e a lista de compras.',
      body: (
        <div className="flex flex-col gap-4">
          {[
            { label: 'Adultos', value: adults, set: setAdults, min: 1 },
            { label: 'Crianças', value: children, set: setChildren, min: 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{row.label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Menos ${row.label}`}
                  onClick={() => row.set(Math.max(row.min, row.value - 1))}
                  className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-400 transition"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-semibold text-gray-800 dark:text-white tabular-nums">
                  {row.value}
                </span>
                <button
                  type="button"
                  aria-label={`Mais ${row.label}`}
                  onClick={() => row.set(Math.min(12, row.value + 1))}
                  className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-400 transition"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Que tipo de comida você prefere?',
      hint: 'Dá para mudar depois, e "Variada" mistura tudo.',
      body: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(options?.cuisineStyles ?? []).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setCuisineStyle(o.value)}
              aria-pressed={o.value === cuisineStyle}
              className={`text-sm px-3 py-2 rounded-lg border transition text-left ${
                o.value === cuisineStyle
                  ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'O que você mais gosta de comer?',
      hint: 'Escolha à vontade — o cardápio vai girar em torno disto.',
      body: (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Proteínas</div>
            <MultiChips choices={PROTEIN_CHOICES} selected={proteins} onToggle={toggle(proteins, setProteins)} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Carboidratos</div>
            <MultiChips choices={CARB_CHOICES} selected={carbs} onToggle={toggle(carbs, setCarbs)} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Legumes e vegetais</div>
            <MultiChips choices={VEGGIE_CHOICES} selected={veggies} onToggle={toggle(veggies, setVeggies)} />
          </div>
        </div>
      ),
    },
    {
      title: 'Algum prato que você adora?',
      hint: 'Opcional. Ex.: lasanha, feijoada, bacalhau com natas.',
      body: (
        <TagField
          items={dishes}
          suggestions={['Lasanha', 'Feijoada', 'Bacalhau à Brás', 'Risoto', 'Strogonoff', 'Frango assado', 'Tacos', 'Sopa de legumes']}
          placeholder="Escreva o prato e Enter"
          tone="favorite"
          onChange={setDishes}
        />
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Modal isOpen={isOpen} onClose={onSkip} className="max-w-[640px] m-4" showCloseButton={false}>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}`}
            />
          ))}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{current.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{current.hint}</p>

        <div className="min-h-[180px]">{current.body}</div>

        <div className="flex items-center justify-between gap-3 mt-7">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            Pular por agora
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => (isLast ? finish() : setStep(step + 1))}
            >
              {isLast ? (saving ? 'Salvando...' : 'Concluir') : 'Continuar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
