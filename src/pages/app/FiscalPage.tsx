import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useFiscal, FiscalData, FiscalTag } from '../../hooks/useFiscal';
import { useUserProfile } from '../../hooks/useUserProfile';

// ===== Helpers de data (pt-PT) =====
function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** "5 ago 2026" */
function formatDatePt(iso: string): string {
  return toDate(iso)
    .toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/ de /g, ' ')
    .replace(/\./g, '');
}

function formatRange(iso: string, endIso?: string): string {
  if (!endIso) return formatDatePt(iso);
  return `${formatDatePt(iso)} — ${formatDatePt(endIso)}`;
}

/** { m: "Ago", d: "5" } para a caixinha de calendário */
function calBox(iso: string): { m: string; d: string } {
  const d = toDate(iso);
  const m = d.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '');
  return {
    m: m.charAt(0).toUpperCase() + m.slice(1),
    d: String(d.getDate()),
  };
}

function relativeHint(daysUntil: number): string {
  if (daysUntil <= 0) return 'hoje';
  if (daysUntil === 1) return 'amanhã';
  return `em ${daysUntil} dias`;
}

function formatEur(value: number): string {
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

// ===== Estilos por tag da timeline =====
const TAG_LABEL: Record<FiscalTag, string> = {
  mensal: 'Mensal',
  anual: 'Anual',
  ss: 'Segurança Social',
  limite: 'Limite IVA',
};

const TAG_CLASSES: Record<FiscalTag, string> = {
  mensal: 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  anual: 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  ss: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  limite: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
};

export default function FiscalPage() {
  const [data, setData] = useState<FiscalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulário de configuração / edição
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ activityStartDate: '', fiscalNumber: '' });

  const { getObligations } = useFiscal();
  const { updateProfile } = useUserProfile();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getObligations();
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Não foi possível carregar as obrigações fiscais.');
    } finally {
      setIsLoading(false);
    }
  }, [getObligations]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = () => {
    if (data && data.configured) {
      setForm({
        activityStartDate: data.profile.activityStartDate ?? '',
        fiscalNumber: data.profile.fiscalNumber ?? '',
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.activityStartDate) {
      toast.error('Informe a data de início de atividade.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        fiscalCountry: 'PT',
        fiscalRegime: 'PT_SIMPLIFICADO_ISENCAO_ART53',
        activityStartDate: form.activityStartDate,
        fiscalNumber: form.fiscalNumber.trim() || undefined,
      });
      toast.success('Perfil fiscal guardado!');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível guardar o perfil fiscal.');
    } finally {
      setIsSaving(false);
    }
  };

  // ===== Estados de carregamento / erro =====
  if (isLoading) {
    return (
      <PageShell title="Fiscal" description="As suas obrigações fiscais em Portugal">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" color="brand" message="A carregar obrigações…" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Fiscal" description="As suas obrigações fiscais em Portugal">
        <Surface className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-500 dark:bg-rose-400/10 dark:text-rose-400">
            <i className="fas fa-triangle-exclamation"></i>
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-gray-900 dark:text-white">
            Algo correu mal
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={load}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-brand-300"
          >
            <i className="fas fa-rotate-right text-xs"></i>
            Tentar de novo
          </button>
        </Surface>
      </PageShell>
    );
  }

  // ===== Formulário de configuração (perfil não configurado OU edição) =====
  const showSetup = !data || !data.configured || showForm;

  if (showSetup) {
    const isEditing = Boolean(data && data.configured);
    return (
      <PageShell
        title="Fiscal"
        description="As suas obrigações fiscais em Portugal"
        actions={
          isEditing ? (
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/5"
            >
              <i className="fas fa-xmark text-xs"></i>
              Cancelar
            </button>
          ) : undefined
        }
      >
        <Surface className="p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-400 text-xl text-gray-950 shadow-glow">
            <i className="fas fa-file-invoice"></i>
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar o seu perfil fiscal' : 'Configure o seu perfil fiscal'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Este painel é para <strong className="font-medium text-gray-700 dark:text-gray-200">trabalhadores
            independentes em Portugal</strong> no Regime Simplificado de IRS com isenção de IVA (art.
            53.º). Indique quando iniciou a atividade e o seu NIF para vermos o que tem de entregar e
            quando.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                País
              </label>
              <select
                value="PT"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 dark:border-white/[0.08] dark:bg-gray-700/60 dark:text-white"
              >
                <option value="PT">🇵🇹 Portugal</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                De momento só está disponível para Portugal.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data de início de atividade <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.activityStartDate}
                onChange={(e) => setForm({ ...form, activityStartDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Como consta no Comprovativo de Início de Atividade.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                NIF (opcional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.fiscalNumber}
                onChange={(e) => setForm({ ...form, fiscalNumber: e.target.value })}
                placeholder="Ex.: 123 456 789"
                className="w-full max-w-xs rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    A guardar…
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    {isEditing ? 'Guardar alterações' : 'Guardar perfil fiscal'}
                  </>
                )}
              </button>
            </div>
          </form>
        </Surface>
      </PageShell>
    );
  }

  // ===== Vista configurada =====
  const { profile, status, obligations, upcoming, nextDeadline, disclaimer } = data;
  const next = nextDeadline;
  const nextCal = next ? calBox(next.date) : null;

  return (
    <PageShell
      title="Fiscal"
      description="As suas obrigações fiscais em Portugal — Regime Simplificado, isenção de IVA"
      actions={
        <button
          onClick={openForm}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/5"
        >
          <i className="fas fa-pen text-xs"></i>
          Editar perfil fiscal
        </button>
      }
    >
      {/* 1. Cartão de perfil */}
      <Surface className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-400 text-xl text-gray-950 shadow-glow">
              🇵🇹
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                Trabalhador Independente
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Portugal · {profile.regimeLabel}</p>
            </div>
          </div>
          {profile.fiscalNumber && (
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Número Fiscal
              </p>
              <p className="font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {profile.fiscalNumber}
              </p>
            </div>
          )}
        </div>

        {/* Chips de estado */}
        <div className="mt-5 flex flex-wrap gap-2">
          {status.socialSecurityFirstYearExempt && (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Seg. Social — isento no 1.º ano
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
            <span className="h-2 w-2 rounded-full bg-brand-500"></span>
            {profile.ivaLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/[0.08] dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            {profile.regimeLabel}
          </span>
        </div>

        {/* Factos-chave */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Início de atividade
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatDatePt(profile.activityStartDate)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Limite de isenção IVA
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatEur(profile.thresholdEur)} / ano
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Fim da isenção Seg. Social
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {status.socialSecurityExemptUntil
                ? formatDatePt(status.socialSecurityExemptUntil)
                : '—'}
            </p>
          </div>
        </div>
      </Surface>

      {/* 2. Próximo prazo */}
      {next && nextCal && (
        <Surface className="overflow-hidden">
          <div className="flex items-center gap-4 p-5 dark:bg-gradient-to-br dark:from-brand-400/[0.10] dark:to-transparent sm:p-6">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-gray-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                {nextCal.m}
              </span>
              <span className="font-display text-2xl font-semibold leading-none text-gray-900 dark:text-white">
                {nextCal.d}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Próximo prazo
                </p>
                <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                  {relativeHint(next.daysUntil)}
                </span>
              </div>
              <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{next.title}</p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{next.description}</p>
            </div>
          </div>
        </Surface>
      )}

      {/* 3. Próximos prazos (timeline) */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Próximos prazos
          </h2>
          <Surface className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {upcoming.map((item, i) => (
              <div key={`${item.date}-${i}`} className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr] sm:gap-4">
                <div>
                  <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatRange(item.date, item.endDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {relativeHint(item.daysUntil)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${TAG_CLASSES[item.tag]}`}
                  >
                    {TAG_LABEL[item.tag] ?? item.tag}
                  </span>
                </div>
              </div>
            ))}
          </Surface>
        </div>
      )}

      {/* 4. Obrigações recorrentes */}
      {obligations.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            O que tem de fazer, e com que frequência
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {obligations.map((ob) => (
              <Surface key={ob.key} className="flex flex-col gap-2 p-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {ob.frequency}
                </span>
                <h3 className="font-medium text-gray-900 dark:text-white">{ob.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ob.description}</p>
                {ob.meta && (
                  <span className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    {ob.meta}
                  </span>
                )}
              </Surface>
            ))}
          </div>
        </div>
      )}

      {/* 5. Medidor do limite dos 15.000 € */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Vigie o limite dos {formatEur(profile.thresholdEur)}
        </h2>
        <Surface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-xl font-semibold text-gray-900 dark:text-white">
              Limite de isenção de IVA
            </p>
            <p className="text-sm tabular-nums text-gray-400 dark:text-gray-500">
              {formatEur(profile.thresholdEur)} / ano
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-white/[0.06] dark:bg-gray-900">
            <span className="block h-full w-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-400"></span>
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums text-gray-400 dark:text-gray-500">
            <span>0 €</span>
            <span>{formatEur(profile.thresholdEur)}</span>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            A isenção de IVA (art. 53.º) só se mantém abaixo deste volume de negócios anual. Se
            ultrapassar <strong className="font-medium text-gray-700 dark:text-gray-200">{formatEur(profile.thresholdEur)}</strong>,
            entrega declaração de alterações e passa ao regime normal de IVA. Se ultrapassar em mais
            de 25% (<strong className="font-medium text-gray-700 dark:text-gray-200">{formatEur(profile.thresholdEur * 1.25)}</strong>),
            o prazo é de <strong className="font-medium text-gray-700 dark:text-gray-200">15 dias úteis</strong>; caso
            contrário, em <strong className="font-medium text-gray-700 dark:text-gray-200">janeiro do ano seguinte</strong>.
          </p>
        </Surface>
      </div>

      {/* 6. Nota / disclaimer */}
      {disclaimer && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 dark:border-white/[0.10] dark:bg-white/[0.02] dark:text-gray-400">
          <strong className="font-medium text-gray-700 dark:text-gray-300">Nota.</strong> {disclaimer}
        </div>
      )}
    </PageShell>
  );
}
