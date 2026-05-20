import { useEffect, useState } from 'react';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type DayType = 'WORK' | 'OFF' | 'HALF_OFF';

interface ScheduleItem {
  dayOfWeek: number;
  dayType: DayType;
}

interface MealDetail {
  name: string;
  description?: string;
  ingredients: string[];
  howToPrepare?: string[];
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  prepTime: string;
  mealType?: string;
  tip?: string;
}

interface MealPlanDay {
  id: number;
  dayOfWeek: number;
  date: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snacks: string | null;
  calories: number | null;
}

interface MealShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null;
  category: string | null;
  purchased: boolean;
}

interface MealShoppingList {
  id: number;
  totalEstimate: number | null;
  notified: boolean;
  items: MealShoppingItem[];
}

interface MealPlan {
  id: number;
  weekStart: string;
  active: boolean;
  days: MealPlanDay[];
  shoppingList: MealShoppingList | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DAY_TYPE_OPTIONS: { value: DayType; label: string; color: string }[] = [
  { value: 'WORK', label: 'Trabalho (só café)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'HALF_OFF', label: 'Meia folga', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'OFF', label: 'Folga', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
];

const MEAL_TYPE_COLORS: Record<string, string> = {
  proteico: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  leve: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  energético: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  'clássico brasileiro': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  funcional: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  detox: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
};

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { dayOfWeek: 0, dayType: 'OFF' },
  { dayOfWeek: 1, dayType: 'WORK' },
  { dayOfWeek: 2, dayType: 'WORK' },
  { dayOfWeek: 3, dayType: 'WORK' },
  { dayOfWeek: 4, dayType: 'OFF' },
  { dayOfWeek: 5, dayType: 'HALF_OFF' },
  { dayOfWeek: 6, dayType: 'WORK' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMeal(raw: string | null): MealDetail | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { name: raw, ingredients: [], calories: 0, prepTime: '' };
  }
}

function groupByCategory(items: MealShoppingItem[]) {
  return items.reduce<Record<string, MealShoppingItem[]>>((acc, item) => {
    const cat = item.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

// ── BreakfastCard — card rico para o café da manhã ───────────────────────────

function BreakfastCard({ meal, isWorkDay }: { meal: MealDetail; isWorkDay: boolean }) {
  const [showSteps, setShowSteps] = useState(false);
  const typeColor = meal.mealType ? (MEAL_TYPE_COLORS[meal.mealType.toLowerCase()] ?? 'bg-gray-100 text-gray-600') : null;

  return (
    <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">☕</span>
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Café da Manhã
            </span>
            {isWorkDay && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                dia de trabalho
              </span>
            )}
          </div>
        </div>
        {typeColor && meal.mealType && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${typeColor}`}>
            {meal.mealType}
          </span>
        )}
      </div>

      {/* Nome e descrição */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-1">
        {meal.name}
      </h4>
      {meal.description && (
        <p className="text-xs text-amber-700 dark:text-amber-400 italic mb-3">{meal.description}</p>
      )}

      {/* Macros */}
      {(meal.calories > 0 || meal.protein) && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: 'kcal', value: meal.calories, color: 'text-orange-600 dark:text-orange-400' },
            { label: 'prot', value: meal.protein ? `${meal.protein}g` : null, color: 'text-red-600 dark:text-red-400' },
            { label: 'carb', value: meal.carbs ? `${meal.carbs}g` : null, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'fibra', value: meal.fiber ? `${meal.fiber}g` : null, color: 'text-green-600 dark:text-green-400' },
          ]
            .filter((m) => m.value)
            .map((m) => (
              <div key={m.label} className="bg-white/60 dark:bg-white/5 rounded-lg py-1.5 text-center">
                <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{m.label}</div>
              </div>
            ))}
        </div>
      )}

      {/* Ingredientes */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
          Ingredientes
        </p>
        <div className="flex flex-wrap gap-1">
          {meal.ingredients.map((ing, i) => (
            <span
              key={i}
              className="text-xs bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30"
            >
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Passo a passo */}
      {meal.howToPrepare && meal.howToPrepare.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
          >
            <span>{showSteps ? '▾' : '▸'}</span>
            {showSteps ? 'Ocultar preparo' : `Como preparar (${meal.prepTime})`}
          </button>
          {showSteps && (
            <ol className="mt-2 space-y-1.5 pl-1">
              {meal.howToPrepare.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Dica nutricional */}
      {meal.tip && (
        <div className="bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2 flex gap-2 items-start">
          <span className="text-sm">💡</span>
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">{meal.tip}</p>
        </div>
      )}

      {/* Prep time footer */}
      {meal.prepTime && !meal.howToPrepare?.length && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <span>⏱</span> {meal.prepTime}
        </div>
      )}
    </div>
  );
}

// ── MealCard simples (almoço, jantar) ────────────────────────────────────────

function MealCard({ label, meal, emoji }: { label: string; meal: MealDetail; emoji: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span>{emoji}</span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-white">{meal.name}</p>
      {meal.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">{meal.description}</p>
      )}
      {meal.ingredients.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{meal.ingredients.join(', ')}</p>
      )}
      <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
        {meal.calories > 0 && <span>{meal.calories} kcal</span>}
        {meal.protein && <span>{meal.protein}g prot</span>}
        {meal.prepTime && <span>⏱ {meal.prepTime}</span>}
      </div>
    </div>
  );
}

// ── Schedule Config ───────────────────────────────────────────────────────────

function ScheduleConfig({
  schedule,
  onChange,
  onSave,
  saving,
}: {
  schedule: ScheduleItem[];
  onChange: (s: ScheduleItem[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (dayOfWeek: number, dayType: DayType) =>
    onChange(schedule.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, dayType } : s)));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
        Configurar Agenda Semanal
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Defina seus dias de trabalho e folga. A IA ajusta o cardápio para cada tipo de dia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {schedule.map((s) => {
          const opt = DAY_TYPE_OPTIONS.find((o) => o.value === s.dayType)!;
          return (
            <div key={s.dayOfWeek} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                {DAY_NAMES[s.dayOfWeek]}
              </span>
              <select
                value={s.dayType}
                onChange={(e) => update(s.dayOfWeek, e.target.value as DayType)}
                className="text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DAY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${opt.color}`}>
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>Sua configuração atual:</strong> Qui e Dom = Folga completa · Sex = Meia-folga · Demais = Trabalho (só café em casa)
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar Agenda'}
      </button>
    </div>
  );
}

// ── Week Plan View ────────────────────────────────────────────────────────────

function WeekPlanView({ plan, schedule }: { plan: MealPlan; schedule: ScheduleItem[] }) {
  const [selectedDay, setSelectedDay] = useState<number>(
    plan.days[0]?.dayOfWeek ?? 0,
  );

  const dayData = plan.days.find((d) => d.dayOfWeek === selectedDay);
  const breakfast = dayData ? parseMeal(dayData.breakfast) : null;
  const lunch = dayData ? parseMeal(dayData.lunch) : null;
  const dinner = dayData ? parseMeal(dayData.dinner) : null;
  const dayType = schedule.find((s) => s.dayOfWeek === selectedDay)?.dayType ?? 'WORK';

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Cardápio da Semana
          </h3>
          <span className="text-xs text-gray-400">
            Semana de {new Date(plan.weekStart).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Seletor de dias */}
        <div className="flex gap-1 overflow-x-auto pb-3">
          {plan.days.map((d) => {
            const dt = schedule.find((s) => s.dayOfWeek === d.dayOfWeek)?.dayType ?? 'WORK';
            const isActive = d.dayOfWeek === selectedDay;
            const dotColor = dt === 'OFF' ? 'bg-green-400' : dt === 'HALF_OFF' ? 'bg-yellow-400' : 'bg-blue-400';
            return (
              <button
                key={d.dayOfWeek}
                onClick={() => setSelectedDay(d.dayOfWeek)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition min-w-[56px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-xs font-medium">{DAY_SHORT[d.dayOfWeek]}</span>
                <span className={`w-2 h-2 rounded-full mt-1 ${isActive ? 'bg-white/60' : dotColor}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo do dia */}
      <div className="p-5 pt-4">
        {dayData ? (
          <div className="space-y-4">
            {/* Badge do tipo de dia */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800 dark:text-white">
                {DAY_NAMES[selectedDay]}
              </span>
              {dayType === 'WORK' ? (
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  💼 Dia de trabalho
                </span>
              ) : dayType === 'HALF_OFF' ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  🌤 Meia-folga
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                  🌿 Folga
                </span>
              )}
              {dayData.calories && (
                <span className="ml-auto text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  {dayData.calories} kcal total
                </span>
              )}
            </div>

            {/* Café da manhã — card rico */}
            {breakfast && (
              <BreakfastCard meal={breakfast} isWorkDay={dayType === 'WORK'} />
            )}

            {/* Almoço */}
            {lunch ? (
              <MealCard label="Almoço" meal={lunch} emoji="🍽️" />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg px-4 py-3">
                <span>🏢</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Almoço no trabalho
                </span>
              </div>
            )}

            {/* Jantar */}
            {dinner ? (
              <MealCard label="Jantar" meal={dinner} emoji="🌙" />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg px-4 py-3">
                <span>🏢</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Jantar no trabalho
                </span>
              </div>
            )}

            {/* Snack */}
            {dayData.snacks && (
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span>🍎</span>
                <div>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">
                    Lanche
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{dayData.snacks}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhum dado para este dia.</p>
        )}
      </div>
    </div>
  );
}

// ── Shopping List ─────────────────────────────────────────────────────────────

function ShoppingListView({
  list,
  onToggle,
  onNotify,
  notifying,
}: {
  list: MealShoppingList;
  onToggle: (id: number) => void;
  onNotify: () => void;
  notifying: boolean;
}) {
  const grouped = groupByCategory(list.items);
  const pending = list.items.filter((i) => !i.purchased);
  const totalPending = pending.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
  const progress = Math.round(((list.items.length - pending.length) / list.items.length) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lista de Compras</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pending.length} de {list.items.length} itens restantes
          </p>
        </div>
        <button
          onClick={onNotify}
          disabled={notifying || pending.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          📲 {notifying ? 'Enviando...' : 'Enviar via WhatsApp'}
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{progress}% comprado</span>
          <span>R${totalPending.toFixed(2)} restante</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {list.totalEstimate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2 mb-4 text-sm text-blue-700 dark:text-blue-300 font-medium">
          💰 Estimativa total da semana: R${list.totalEstimate.toFixed(2)}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              {cat}
            </h4>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                    item.purchased ? 'opacity-40' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => onToggle(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <span className={`flex-1 text-sm text-gray-800 dark:text-white ${item.purchased ? 'line-through' : ''}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-400">{item.quantity} {item.unit}</span>
                  {item.estimatedPrice && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      R${item.estimatedPrice.toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'schedule' | 'plan' | 'shopping' | 'history';

export default function MealPlannerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [allPlans, setAllPlans] = useState<MealPlan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [budget, setBudget] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSchedule();
    loadActivePlan();
  }, []);

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  async function loadSchedule() {
    try {
      const data = await api.get<ScheduleItem[]>('/meal-planner/schedule');
      if (data?.length) {
        setSchedule(DEFAULT_SCHEDULE.map((def) => data.find((d) => d.dayOfWeek === def.dayOfWeek) ?? def));
      }
    } catch { /* usa padrão */ }
  }

  async function loadActivePlan() {
    setLoading(true);
    try {
      const data = await api.get<MealPlan | null>('/meal-planner/active');
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      await api.post('/meal-planner/schedule', { schedule });
      flash('success', 'Agenda salva!');
    } catch {
      flash('error', 'Erro ao salvar agenda.');
    } finally {
      setSaving(false);
    }
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const body: { budget?: number } = {};
      if (budget) body.budget = parseFloat(budget);
      const data = await api.post<MealPlan>('/meal-planner/generate', body);
      setPlan(data);
      setActiveTab('plan');
      flash('success', 'Planejamento gerado!');
    } catch {
      flash('error', 'Erro ao gerar planejamento. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  async function toggleItem(itemId: number) {
    try {
      await api.patch(`/meal-planner/item/${itemId}/toggle`, {});
      setPlan((prev) => {
        if (!prev?.shoppingList) return prev;
        return {
          ...prev,
          shoppingList: {
            ...prev.shoppingList,
            items: prev.shoppingList.items.map((i) =>
              i.id === itemId ? { ...i, purchased: !i.purchased } : i,
            ),
          },
        };
      });
    } catch {
      flash('error', 'Erro ao atualizar item.');
    }
  }

  async function sendNotification() {
    setNotifying(true);
    try {
      const r = await api.post<{ sent: boolean; reason?: string }>('/meal-planner/notify', {});
      flash(r.sent ? 'success' : 'error', r.sent ? 'Lista enviada via WhatsApp!' : (r.reason ?? 'Não foi possível enviar.'));
    } catch {
      flash('error', 'Erro ao enviar notificação.');
    } finally {
      setNotifying(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const data = await api.get<MealPlan[]>('/meal-planner/plans');
      setAllPlans(data ?? []);
    } catch {
      flash('error', 'Erro ao carregar histórico.');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function deletePlan(id: number) {
    setDeletingId(id);
    try {
      await api.delete(`/meal-planner/plans/${id}`);
      setAllPlans((prev) => prev.filter((p) => p.id !== id));
      if (plan?.id === id) setPlan(null);
      flash('success', 'Plano apagado.');
    } catch {
      flash('error', 'Erro ao apagar plano.');
    } finally {
      setDeletingId(null);
    }
  }

  async function clearAllHistory() {
    setClearingHistory(true);
    setConfirmClearAll(false);
    try {
      await api.delete('/meal-planner/plans/history');
      setAllPlans([]);
      setPlan(null);
      flash('success', 'Histórico apagado com sucesso.');
    } catch {
      flash('error', 'Erro ao limpar histórico.');
    } finally {
      setClearingHistory(false);
    }
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'plan', label: 'Cardápio', emoji: '🍽️' },
    { key: 'shopping', label: 'Compras', emoji: '🛒' },
    { key: 'schedule', label: 'Agenda', emoji: '📅' },
    { key: 'history', label: 'Histórico', emoji: '📋' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Planejador Alimentar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            IA cria cardápio semanal personalizado com café detalhado + lista de compras
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            placeholder="Orçamento (R$)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Gerando IA...
              </>
            ) : '✨ Gerar Planejamento'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          msg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); if (t.key === 'history') loadHistory(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'schedule' && (
        <ScheduleConfig schedule={schedule} onChange={setSchedule} onSave={saveSchedule} saving={saving} />
      )}

      {activeTab === 'plan' && (
        loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin w-7 h-7 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Carregando...
          </div>
        ) : plan ? (
          <WeekPlanView plan={plan} schedule={schedule} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="text-5xl mb-4">🥗</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum planejamento ativo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Configure sua agenda e clique em "Gerar Planejamento".
            </p>
            <button
              onClick={() => setActiveTab('schedule')}
              className="px-5 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              Configurar Agenda
            </button>
          </div>
        )
      )}

      {activeTab === 'shopping' && (
        loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Carregando...</div>
        ) : plan?.shoppingList ? (
          <ShoppingListView
            list={plan.shoppingList}
            onToggle={toggleItem}
            onNotify={sendNotification}
            notifying={notifying}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhuma lista gerada
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gere um planejamento para ver a lista de compras.
            </p>
          </div>
        )
      )}

      {activeTab === 'history' && (
        <>
          {/* Confirm clear all modal */}
          {confirmClearAll && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="text-3xl mb-3 text-center">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center mb-2">
                  Apagar todo o histórico?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                  Todos os planos serão removidos permanentemente. Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={clearAllHistory}
                    disabled={clearingHistory}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {clearingHistory ? 'Apagando...' : 'Apagar tudo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Histórico de Planos
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {allPlans.length} plano{allPlans.length !== 1 ? 's' : ''} guardado{allPlans.length !== 1 ? 's' : ''}
                </p>
              </div>
              {allPlans.length > 0 && (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  disabled={clearingHistory}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                >
                  🗑 {clearingHistory ? 'Limpando...' : 'Limpar tudo'}
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Carregando histórico...
              </div>
            ) : allPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Sem histórico ainda
                </h4>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Os planos gerados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allPlans.map((p) => {
                  const weekDate = new Date(p.weekStart).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isConfirming = deletingId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <span className="text-lg">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            Semana de {weekDate}
                          </span>
                          {p.active && (
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                              ✓ Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {p.days.length} dias · {p.shoppingList ? `${p.shoppingList.items.length} itens na lista` : 'Sem lista de compras'}
                        </p>
                      </div>
                      <button
                        onClick={() => deletePlan(p.id)}
                        disabled={isConfirming}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                      >
                        {isConfirming ? (
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : '🗑'}
                        {isConfirming ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
