import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import { useFiscal, FiscalChatMessage, FiscalData, FiscalTag } from '../../hooks/useFiscal';
import { useUserProfile } from '../../hooks/useUserProfile';

// ===== Assistente Fiscal — sugestões iniciais =====
const FISCAL_SUGGESTIONS = [
  'Preciso de fazer alguma coisa agora?',
  'Como trato o IVA de um cliente da UE?',
  'Tenho de fazer retenção na fonte?',
  'O que muda ao passar os 15.000 €?',
];

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
  faturas: 'Faturas',
  iva: 'IVA',
  irs: 'IRS',
  ss: 'Segurança Social',
  estrangeiro: 'Internacional',
  contabilidade: 'Contabilidade',
};

const TAG_CLASSES: Record<FiscalTag, string> = {
  faturas: 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  iva: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300',
  irs: 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  ss: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  estrangeiro: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  contabilidade: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
};

type FiscalForm = {
  activityStartDate: string;
  fiscalNumber: string;
  accountingRegime: 'simplified' | 'organized';
  vatRegime: 'exempt_art53' | 'exempt_art9' | 'normal_quarterly' | 'normal_monthly';
  withholdingMode: 'exempt_art101b' | 'withholding' | 'not_applicable';
  socialSecurityStatus:
    | 'auto'
    | 'contributing'
    | 'exempt_employment'
    | 'exempt_pension'
    | 'foreign_scheme'
    | 'professional_fund';
  activityCode: string;
  annualRevenue: string;
  hasEuB2bClients: boolean;
  hasNonEuClients: boolean;
  hasPaymentsOnAccount: boolean;
  hasWorkAccidentInsurance: boolean;
  usesPortalInvoices: boolean;
  hasEmployees: boolean;
};

const EMPTY_FORM: FiscalForm = {
  activityStartDate: '',
  fiscalNumber: '',
  accountingRegime: 'simplified',
  vatRegime: 'exempt_art53',
  withholdingMode: 'exempt_art101b',
  socialSecurityStatus: 'auto',
  activityCode: '',
  annualRevenue: '',
  hasEuB2bClients: false,
  hasNonEuClients: false,
  hasPaymentsOnAccount: false,
  hasWorkAccidentInsurance: false,
  usesPortalInvoices: true,
  hasEmployees: false,
};

export default function FiscalPage() {
  const [data, setData] = useState<FiscalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulário de configuração / edição
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FiscalForm>(EMPTY_FORM);

  const { getObligations, askFiscal } = useFiscal();
  const { updateProfile } = useUserProfile();

  // ===== Assistente Fiscal (chat) =====
  const [chat, setChat] = useState<FiscalChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isThinking]);

  const sendChat = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || isThinking) return;

      const history = chat;
      setChat((prev) => [...prev, { role: 'user', content: question }]);
      setChatInput('');
      setIsThinking(true);
      try {
        const { answer } = await askFiscal(question, history);
        setChat((prev) => [...prev, { role: 'assistant', content: answer }]);
      } catch (err) {
        toast.error((err as Error).message || 'Não foi possível obter a resposta.');
        setChat((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Desculpe, não consegui responder agora. Tente novamente daqui a pouco.',
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [askFiscal, chat, isThinking]
  );

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
        accountingRegime: data.profile.accountingRegime,
        vatRegime: data.profile.ivaStatus,
        withholdingMode: data.profile.withholdingMode,
        socialSecurityStatus: data.profile
          .socialSecurityStatus as FiscalForm['socialSecurityStatus'],
        activityCode: data.profile.activityCode ?? '',
        annualRevenue: String(data.profile.annualRevenue || ''),
        hasEuB2bClients: data.profile.hasEuB2bClients,
        hasNonEuClients: data.profile.hasNonEuClients,
        hasPaymentsOnAccount: data.profile.hasPaymentsOnAccount,
        hasWorkAccidentInsurance: data.profile.hasWorkAccidentInsurance,
        usesPortalInvoices: data.profile.usesPortalInvoices,
        hasEmployees: data.profile.hasEmployees,
      });
    } else {
      setForm(EMPTY_FORM);
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
        fiscalRegime:
          form.accountingRegime === 'organized'
            ? 'PT_CONTABILIDADE_ORGANIZADA'
            : 'PT_REGIME_SIMPLIFICADO',
        activityStartDate: form.activityStartDate,
        fiscalNumber: form.fiscalNumber.replace(/\s/g, '') || undefined,
        fiscalAccountingRegime: form.accountingRegime,
        fiscalVatRegime: form.vatRegime,
        fiscalWithholdingMode: form.withholdingMode,
        fiscalSocialSecurityStatus: form.socialSecurityStatus,
        fiscalActivityCode: form.activityCode.trim() || undefined,
        fiscalAnnualRevenue: Math.max(0, Number(form.annualRevenue) || 0),
        fiscalHasEuB2bClients: form.hasEuB2bClients,
        fiscalHasNonEuClients: form.hasNonEuClients,
        fiscalHasPaymentsOnAccount: form.hasPaymentsOnAccount,
        fiscalHasWorkAccidentInsurance: form.hasWorkAccidentInsurance,
        fiscalUsesPortalInvoices: form.usesPortalInvoices,
        fiscalHasEmployees: form.hasEmployees,
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
            Responda conforme consta no seu comprovativo de atividade. O calendário adapta IVA, IRS,
            retenção, Segurança Social, clientes internacionais e contabilidade ao seu caso.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                NIF (opcional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.fiscalNumber}
                onChange={(e) => setForm({ ...form, fiscalNumber: e.target.value })}
                placeholder="Ex.: 123 456 789"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                CAE ou código CIRS principal
              </label>
              <input
                type="text"
                value={form.activityCode}
                onChange={(e) => setForm({ ...form, activityCode: e.target.value })}
                placeholder="Ex.: CIRS 1519 ou CAE 62010"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Regime de IRS/contabilidade
              </label>
              <select
                value={form.accountingRegime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountingRegime: e.target.value as FiscalForm['accountingRegime'],
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              >
                <option value="simplified">Regime simplificado</option>
                <option value="organized">Contabilidade organizada</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enquadramento de IVA
              </label>
              <select
                value={form.vatRegime}
                onChange={(e) =>
                  setForm({ ...form, vatRegime: e.target.value as FiscalForm['vatRegime'] })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              >
                <option value="exempt_art53">Isento — artigo 53.º</option>
                <option value="exempt_art9">Isento — artigo 9.º (natureza da atividade)</option>
                <option value="normal_quarterly">Regime normal — trimestral</option>
                <option value="normal_monthly">Regime normal — mensal</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Retenção na fonte de IRS
              </label>
              <select
                value={form.withholdingMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    withholdingMode: e.target.value as FiscalForm['withholdingMode'],
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              >
                <option value="exempt_art101b">Dispensa — artigo 101.º-B</option>
                <option value="withholding">Faço retenção quando aplicável</option>
                <option value="not_applicable">Não aplicável ao meu caso</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Situação na Segurança Social
              </label>
              <select
                value={form.socialSecurityStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    socialSecurityStatus: e.target.value as FiscalForm['socialSecurityStatus'],
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              >
                <option value="auto">Calcular pelo início da atividade</option>
                <option value="contributing">Estou a contribuir</option>
                <option value="exempt_employment">
                  Isento — acumulação com trabalho dependente
                </option>
                <option value="exempt_pension">Isento — pensão/incapacidade</option>
                <option value="foreign_scheme">Abrangido por regime de outro país</option>
                <option value="professional_fund">Caixa profissional própria</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Volume de negócios no ano atual (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.annualRevenue}
                onChange={(e) => setForm({ ...form, annualRevenue: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Atualize este valor para receber alertas de limites.
              </p>
            </div>

            <fieldset className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.08] lg:col-span-2">
              <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Situações que alteram as obrigações
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['hasEuB2bClients', 'Presto serviços B2B a clientes da UE'],
                  ['hasNonEuClients', 'Tenho clientes fora da UE'],
                  ['hasPaymentsOnAccount', 'A AT comunicou pagamentos por conta'],
                  ['hasWorkAccidentInsurance', 'Tenho seguro de acidentes de trabalho'],
                  ['usesPortalInvoices', 'Emito tudo no Portal das Finanças/ATGO'],
                  ['hasEmployees', 'Tenho trabalhadores contratados'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof FiscalForm])}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>A guardar…
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
  const { profile, status, warnings, obligations, upcoming, nextDeadline, sources, disclaimer } =
    data;
  const next = nextDeadline;
  const nextCal = next ? calBox(next.date) : null;

  return (
    <PageShell
      title="Fiscal"
      description="Calendário personalizado de IVA, IRS, Segurança Social e faturação em Portugal"
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Portugal · {profile.regimeLabel}
              </p>
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
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
            {profile.withholdingLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            {profile.socialSecurityLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/[0.08] dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            {profile.regimeLabel}
          </span>
        </div>

        {/* Factos-chave */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              Volume no ano
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatEur(profile.annualRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              CAE/CIRS principal
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {profile.activityCode || 'Por preencher'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Perfil completo
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {status.profileCompleteness}%
            </p>
          </div>
        </div>
      </Surface>

      {/* Alertas derivados do perfil */}
      {warnings.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Pontos que precisam de atenção
          </h2>
          <div className="space-y-3">
            {warnings.map((warning) => (
              <Surface
                key={warning.key}
                className={`border-l-4 p-4 ${
                  warning.severity === 'critical'
                    ? 'border-l-rose-500'
                    : warning.severity === 'warning'
                      ? 'border-l-amber-500'
                      : 'border-l-brand-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <i
                    className={`fas mt-0.5 ${
                      warning.severity === 'critical'
                        ? 'fa-circle-exclamation text-rose-500'
                        : warning.severity === 'warning'
                          ? 'fa-triangle-exclamation text-amber-500'
                          : 'fa-circle-info text-brand-500'
                    }`}
                  ></i>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{warning.title}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {warning.description}
                    </p>
                    {warning.sourceUrl && (
                      <a
                        href={warning.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Consultar fonte oficial{' '}
                        <i className="fas fa-arrow-up-right-from-square ml-1"></i>
                      </a>
                    )}
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      )}

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

      {/* 2b. Assistente Fiscal (chat) */}
      <Surface className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-white/[0.06] sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-400 text-xl text-gray-950 shadow-glow">
            🤖
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Assistente Fiscal
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tire dúvidas sobre as suas obrigações
            </p>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="max-h-96 min-h-[9rem] flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {chat.length === 0 && !isThinking && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Faça uma pergunta ou comece por uma destas:
              </p>
              <div className="flex flex-wrap gap-2">
                {FISCAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendChat(s)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-white/[0.08] dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-brand-400 text-gray-950'
                    : 'bg-gray-100 text-gray-800 dark:bg-white/[0.06] dark:text-gray-200'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 dark:bg-white/[0.06]">
                <LoadingSpinner size="xs" color="brand" />
                <span className="text-sm text-gray-500 dark:text-gray-400">a pensar…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChat(chatInput);
          }}
          className="flex items-center gap-2 border-t border-gray-100 p-4 dark:border-white/[0.06]"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Escreva a sua pergunta…"
            disabled={isThinking}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 disabled:opacity-60 dark:border-white/[0.08] dark:bg-gray-800 dark:text-white"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isThinking || !chatInput.trim()}
            startIcon={<i className="fas fa-paper-plane text-xs"></i>}
          >
            Enviar
          </Button>
        </form>
      </Surface>

      {/* 3. Próximos prazos (timeline) */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Próximos prazos
          </h2>
          <Surface className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {upcoming.map((item, i) => (
              <div
                key={`${item.date}-${i}`}
                className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr] sm:gap-4"
              >
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
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Fonte oficial
                    </a>
                  )}
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
                {ob.sourceUrl && (
                  <a
                    href={ob.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto pt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Ver regra oficial <i className="fas fa-arrow-up-right-from-square ml-1"></i>
                  </a>
                )}
              </Surface>
            ))}
          </div>
        </div>
      )}

      {/* 5. Medidor do limite do artigo 53.º */}
      {profile.ivaStatus === 'exempt_art53' && (
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
              <span
                className={`block h-full rounded-full ${
                  status.revenueProgressPercent >= 100
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-brand-400 to-amber-400'
                }`}
                style={{ width: `${Math.min(100, status.revenueProgressPercent)}%` }}
              ></span>
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-gray-400 dark:text-gray-500">
              <span>0 €</span>
              <span>{formatEur(profile.thresholdEur)}</span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Registou{' '}
              <strong className="font-medium text-gray-700 dark:text-gray-200">
                {formatEur(profile.annualRevenue)}
              </strong>
              . Acima de {formatEur(profile.thresholdEur)}, sem exceder{' '}
              {formatEur(profile.immediateExitThresholdEur)}, a mudança ocorre no ano seguinte.
              Acima de {formatEur(profile.immediateExitThresholdEur)}, a saída é imediata e a
              alteração deve ser entregue em 15 dias úteis.
            </p>
          </Surface>
        </div>
      )}

      <Surface className="p-5">
        <h2 className="font-medium text-gray-900 dark:text-white">
          Fontes oficiais usadas pelo calendário
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {source.title} <i className="fas fa-arrow-up-right-from-square ml-1 text-xs"></i>
            </a>
          ))}
        </div>
      </Surface>

      {/* 6. Nota / disclaimer */}
      {disclaimer && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 dark:border-white/[0.10] dark:bg-white/[0.02] dark:text-gray-400">
          <strong className="font-medium text-gray-700 dark:text-gray-300">Nota.</strong>{' '}
          {disclaimer}
        </div>
      )}
    </PageShell>
  );
}
