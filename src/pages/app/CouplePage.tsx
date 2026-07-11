import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useCoupleInvites } from '../../hooks/useCoupleInvites';
import { FinanceSummary, useFinance } from '../../hooks/useFinance';
import { currencyOption, formatMoney } from '../../utils/currency';

const sharedAreas = [
  {
    name: 'Transações',
    description: 'Receitas e despesas dos dois',
    icon: 'arrow-right-arrow-left',
    path: '/transacoes',
  },
  {
    name: 'Orçamento',
    description: 'Limites por categoria em conjunto',
    icon: 'wallet',
    path: '/orcamento',
  },
  {
    name: 'Metas',
    description: 'Objetivos financeiros do casal',
    icon: 'bullseye',
    path: '/',
  },
  {
    name: 'Compras',
    description: 'Listas compartilhadas em tempo real',
    icon: 'cart-shopping',
    path: '/compras',
  },
  {
    name: 'Despensa',
    description: 'O que tem em casa, para os dois',
    icon: 'box-open',
    path: '/despensa',
  },
  {
    name: 'Recorrentes',
    description: 'Contas fixas e assinaturas da casa',
    icon: 'rotate',
    path: '/recorrentes',
  },
];

const howItWorks = [
  {
    icon: 'user-plus',
    title: 'Cada um tem sua conta',
    text: 'Seu par cria a própria conta no FinPloit com o telefone dele(a).',
  },
  {
    icon: 'link',
    title: 'Você vincula pelo telefone',
    text: 'Informe o telefone cadastrado do seu par no formulário ao lado.',
  },
  {
    icon: 'heart',
    title: 'Tudo vira um workspace só',
    text: 'Transações, orçamento, metas, listas e despensa passam a ser dos dois.',
  },
];

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CouplePage() {
  const { profile, getProfile, dissociateCouple, isLoading } = useUserProfile();
  const { invites, loadInvites, createInvite, acceptInvite, rejectInvite, cancelInvite } =
    useCoupleInvites();
  const { getFinanceSummary } = useFinance();

  const [spousePhone, setSpousePhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  const isMarried = Boolean(profile?.isMarried && profile?.spouseId);

  useEffect(() => {
    getProfile().catch(() => {});
    loadInvites().catch(() => {});
  }, [getProfile, loadInvites]);

  const receivedInvite = invites.received[0];
  const sentInvite = invites.sent[0];

  // Carrega o resumo só quando o estado de casal muda.
  // getFinanceSummary NÃO é memoizado no useFinance — incluí-lo nas deps causava
  // re-render infinito (a página travava), então fica de fora de propósito.
  useEffect(() => {
    if (!isMarried) return;
    let alive = true;
    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      try {
        const data = await getFinanceSummary({
          startDate: monthStart.toISOString(),
          endDate: now.toISOString(),
        });
        if (alive) setSummary(data);
      } catch {
        if (alive) setSummary(null);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarried]);

  // Cancela a confirmação de desvincular se o usuário não confirmar em alguns segundos
  useEffect(() => {
    if (!confirmUnlink) return;
    const timer = setTimeout(() => setConfirmUnlink(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmUnlink]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = spousePhone.trim();
    if (!phone) {
      toast.error('Informe o telefone do seu par.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createInvite(phone);
      toast.success(result?.message || 'Convite enviado!');
      setSpousePhone('');
      await loadInvites();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível enviar o convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const message = await acceptInvite(id);
      toast.success(typeof message === 'string' ? message : 'Convite aceito!');
      await Promise.all([getProfile(), loadInvites()]);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível aceitar o convite.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectInvite(id);
      toast.success('Convite recusado.');
      await loadInvites();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível recusar o convite.');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelInvite(id);
      toast.success('Convite cancelado.');
      await loadInvites();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível cancelar o convite.');
    }
  };

  const handleUnlink = async () => {
    if (!confirmUnlink) {
      setConfirmUnlink(true);
      return;
    }
    setIsUnlinking(true);
    try {
      const message = await dissociateCouple();
      toast.success(typeof message === 'string' ? message : 'Vínculo desfeito.');
      setConfirmUnlink(false);
      setSummary(null);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível desvincular.');
    } finally {
      setIsUnlinking(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <PageShell title="Casal" description="Um workspace financeiro compartilhado a dois">
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Casal"
      description={
        isMarried
          ? 'Vocês dois compartilham o mesmo workspace financeiro'
          : 'Um workspace financeiro compartilhado a dois'
      }
    >
      {isMarried ? (
        <>
          {/* Cartão do vínculo */}
          <Surface className="overflow-hidden">
            <div className="dark:bg-gradient-to-br dark:from-brand-400/[0.10] dark:to-transparent">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-brand-400 font-display text-lg font-bold text-gray-950 dark:border-gray-800">
                      {initials(profile?.displayName || profile?.name)}
                    </span>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gray-200 font-display text-lg font-bold text-gray-700 dark:border-gray-800 dark:bg-gray-700 dark:text-white">
                      {initials(profile?.spouse?.name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                      Você &amp; {profile?.spouse?.name || 'seu par'}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {profile?.spouse?.phone
                        ? `Telefone: ${profile.spouse.phone}`
                        : 'Workspace compartilhado'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 self-start rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 sm:self-center dark:bg-brand-400/10 dark:text-brand-300">
                  <span className="h-2 w-2 rounded-full bg-brand-400"></span>
                  Vínculo ativo
                </span>
              </div>
            </div>
          </Surface>

          {/* Resumo conjunto do mês */}
          {summary && (
            <div>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Este mês, juntos
                </h2>
                {summary.rateDate && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    em {currencyOption(summary.displayCurrency).flag} {summary.displayCurrency} · câmbio BCE de{' '}
                    {new Date(summary.rateDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Surface className="p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ganhos</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums text-green-600 dark:text-green-400">
                    {formatMoney(summary.totalGanhos, summary.displayCurrency)}
                  </p>
                </Surface>
                <Surface className="p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Despesas</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums text-error-600 dark:text-red-400">
                    {formatMoney(summary.totalDespesas, summary.displayCurrency)}
                  </p>
                </Surface>
                <Surface className="p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatMoney(summary.saldo, summary.displayCurrency)}
                  </p>
                </Surface>
              </div>
              {(summary.byCurrency?.length ?? 0) > 1 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {summary.byCurrency!.map((c) => (
                    <span
                      key={c.currency}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600 dark:border-white/[0.08] dark:text-gray-300"
                    >
                      <span>{currencyOption(c.currency).flag} {c.currency}</span>
                      <span className="text-green-600 dark:text-green-400">+{formatMoney(c.ganhos, c.currency)}</span>
                      <span className="text-error-600 dark:text-red-400">−{formatMoney(c.despesas, c.currency)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* O que é compartilhado */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              O que vocês compartilham
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sharedAreas.map((area) => (
                <Link
                  key={area.name}
                  to={area.path}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 dark:border-white/[0.06] dark:bg-gray-800 dark:hover:border-brand-400/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                      <i className={`fas fa-${area.icon}`}></i>
                    </span>
                    <i className="fas fa-arrow-right text-xs text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500 dark:text-gray-600 dark:group-hover:text-brand-400"></i>
                  </div>
                  <p className="mt-3 font-medium text-gray-900 dark:text-white">{area.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {area.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Desvincular */}
          <Surface className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Desfazer o vínculo</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Cada um volta a ter um workspace separado. Nenhum dado é apagado.
                </p>
              </div>
              <button
                onClick={handleUnlink}
                disabled={isUnlinking}
                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                  confirmUnlink
                    ? 'bg-error-500 text-white hover:bg-error-600'
                    : 'border border-red-200 text-error-600 hover:bg-red-50 dark:border-error-500/30 dark:text-red-400 dark:hover:bg-error-500/10'
                }`}
              >
                {isUnlinking ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className={`fas ${confirmUnlink ? 'fa-triangle-exclamation' : 'fa-unlink'}`}></i>
                )}
                {confirmUnlink ? 'Confirmar desvínculo' : 'Desvincular'}
              </button>
            </div>
          </Surface>
        </>
      ) : receivedInvite ? (
        /* Convite recebido — pede consentimento */
        <Surface className="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-400 font-display text-lg font-bold text-gray-950 shadow-glow">
                {initials(receivedInvite.inviter.displayName || receivedInvite.inviter.name)}
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                  {receivedInvite.inviter.name} te convidou para compartilhar as finanças
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ao aceitar, transações, orçamento, metas, listas e despensa passam a ser dos
                  dois. Convite válido até{' '}
                  {new Date(receivedInvite.expiresAt).toLocaleDateString('pt-BR')}.
                </p>
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => handleAccept(receivedInvite.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300 sm:flex-none"
              >
                <i className="fas fa-check"></i>
                Aceitar
              </button>
              <button
                onClick={() => handleReject(receivedInvite.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:flex-none dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/5"
              >
                Recusar
              </button>
            </div>
          </div>
        </Surface>
      ) : sentInvite ? (
        /* Convite enviado — aguardando resposta */
        <Surface className="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <i className="fas fa-hourglass-half"></i>
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                  Aguardando resposta de {sentInvite.invitee.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  O convite foi enviado{sentInvite.invitee.phone ? ` para ${sentInvite.invitee.phone}` : ''} e
                  vale até {new Date(sentInvite.expiresAt).toLocaleDateString('pt-BR')}. Seu par
                  aceita na tela Casal do app dele(a).
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCancel(sentInvite.id)}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-red-50 dark:border-error-500/30 dark:text-red-400 dark:hover:bg-error-500/10"
            >
              <i className="fas fa-xmark"></i>
              Cancelar convite
            </button>
          </div>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
          {/* Hero + formulário */}
          <Surface className="p-6 lg:col-span-3 lg:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-400 text-xl text-gray-950 shadow-glow">
              <i className="fas fa-heart"></i>
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-gray-900 dark:text-white">
              Finanças a dois, sem planilha nem confusão
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Ao vincular sua conta à do seu par, vocês passam a enxergar e gerenciar tudo juntos:
              cada transação, meta, lista de compras e item da despensa vale para os dois — de
              qualquer dispositivo, incluindo o WhatsApp.
            </p>

            <form onSubmit={handleLink} className="mt-6 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone do seu par
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={spousePhone}
                  onChange={(e) => setSpousePhone(e.target.value)}
                  placeholder="Ex.: +351 912 345 678"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 dark:border-white/[0.08] dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Use o número completo com DDI e DDD, o mesmo cadastrado na conta dele(a).
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300 disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Enviar convite
                  </>
                )}
              </button>
            </form>
          </Surface>

          {/* Como funciona */}
          <Surface className="p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Como funciona
            </h3>
            <ol className="mt-4 space-y-5">
              {howItWorks.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    <i className={`fas fa-${step.icon} text-sm`}></i>
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-[10px] font-bold text-gray-950">
                      {index + 1}
                    </span>
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Surface>
        </div>
      )}
    </PageShell>
  );
}
