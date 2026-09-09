import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import Button from '../../components/ui/button/Button';
import { useConfirm } from '../../components/ui/confirm/useConfirm';
import {
  useAdvisor,
  type AdvisorDomain,
  type AdvisorDomainKey,
  type AdvisorMessage,
  type AdvisorPlan,
  type AdvisorPlanSummary,
} from '../../hooks/useAdvisor';

/** Perguntas que valem a pena para quem nunca falou com isto. */
const SUGESTOES: Record<AdvisorDomainKey, string[]> = {
  debts: [
    'Vale a pena adiantar alguma dívida?',
    'Se eu puser mais 100 € por mês, quanto tempo poupo?',
    'Devia mudar para avalanche?',
  ],
  budget: [
    'Onde é que estou a gastar a mais?',
    'Quanto posso apertar sem partir nada?',
    'A minha sobra é realista?',
  ],
  meals: [
    'A minha meta de comida faz sentido?',
    'Estou a gastar muito em comida?',
    'Como é que baixo o gasto do supermercado?',
  ],
  bills: [
    'O que devia adiar para o próximo salário?',
    'Tenho alguma coisa em atraso?',
    'Que contas pesam mais este mês?',
  ],
};

/**
 * Markdown pobre, de propósito.
 *
 * O plano vem em markdown do modelo e só usa quatro coisas: títulos, negrito,
 * listas e parágrafos. Carregar uma biblioteca inteira para isso — e o
 * saneador que ela obriga a ter — é peso a mais para o que se ganha.
 */
function Markdown({ text }: { text: string }) {
  const blocos = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {blocos.map((linha, i) => {
        const t = linha.trim();
        if (!t) return null;
        const negrito = (s: string) =>
          s.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
            parte.startsWith('**') && parte.endsWith('**') ? (
              <strong key={j} className="font-semibold text-gray-900 dark:text-white">
                {parte.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{parte}</span>
            ),
          );
        if (t.startsWith('#')) {
          const nivel = t.match(/^#+/)?.[0].length ?? 1;
          return (
            <h3
              key={i}
              className={`font-display font-semibold text-gray-900 dark:text-white ${
                nivel <= 2 ? 'pt-2 text-base' : 'pt-1 text-sm'
              }`}
            >
              {t.replace(/^#+\s*/, '')}
            </h3>
          );
        }
        if (/^[-*]\s/.test(t)) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-brand-500">•</span>
              <span>{negrito(t.replace(/^[-*]\s*/, ''))}</span>
            </p>
          );
        }
        if (/^\d+\.\s/.test(t)) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="font-medium text-brand-500">{t.match(/^\d+/)?.[0]}.</span>
              <span>{negrito(t.replace(/^\d+\.\s*/, ''))}</span>
            </p>
          );
        }
        return <p key={i}>{negrito(t)}</p>;
      })}
    </div>
  );
}

/**
 * O assistente do teu dinheiro.
 *
 * Não é um chatbot: cada assunto leva ao modelo os NÚMEROS reais desta pessoa —
 * a fila das dívidas, a sobra do mês, o gasto em comida, as contas por pagar. A
 * diferença entre "convém pagar primeiro o juro mais alto" e "das tuas onze
 * dívidas, a Faculdade são 60% do que deves" é toda.
 */
export default function AdvisorPage() {
  const { getDomains, ask, makePlan, listPlans, getPlan, deletePlan, isAsking, isPlanning } =
    useAdvisor();
  const { confirm, dialog } = useConfirm();

  const [domains, setDomains] = useState<AdvisorDomain[]>([]);
  const [domain, setDomain] = useState<AdvisorDomainKey>('debts');
  const [chat, setChat] = useState<AdvisorMessage[]>([]);
  const [pergunta, setPergunta] = useState('');
  const [contexto, setContexto] = useState<string | null>(null);
  const [verContexto, setVerContexto] = useState(false);
  const [planos, setPlanos] = useState<AdvisorPlanSummary[]>([]);
  const [planoAberto, setPlanoAberto] = useState<AdvisorPlan | null>(null);
  const fimDoChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDomains().then(setDomains).catch(() => {});
  }, [getDomains]);

  const recarregarPlanos = useCallback(() => {
    listPlans(domain).then(setPlanos).catch(() => setPlanos([]));
  }, [listPlans, domain]);

  useEffect(() => {
    // Trocar de assunto começa uma conversa nova: as respostas anteriores
    // falavam de outros números, e arrastá-las só confunde o modelo e quem lê.
    setChat([]);
    setContexto(null);
    setPlanoAberto(null);
    recarregarPlanos();
  }, [domain, recarregarPlanos]);

  useEffect(() => {
    fimDoChat.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.length, isAsking]);

  const spec = domains.find((d) => d.key === domain);

  const perguntar = async (texto: string) => {
    const q = texto.trim();
    if (!q || isAsking) return;
    const historico = chat.slice(-6);
    setChat((prev) => [...prev, { role: 'user', content: q }]);
    setPergunta('');
    try {
      const r = await ask(domain, q, historico);
      setChat((prev) => [...prev, { role: 'assistant', content: r.answer }]);
      setContexto(r.context);
    } catch (e) {
      setChat((prev) => prev.slice(0, -1));
      setPergunta(q);
      toast.error(e instanceof Error ? e.message : 'Não foi possível perguntar.');
    }
  };

  return (
    <PageShell
      title="Assistente"
      description="Fala sobre o teu dinheiro — com os teus números, não com conselhos genéricos"
    >
      <SegmentedTabs
        tabs={domains.map((d) => ({ key: d.key, label: d.label }))}
        active={domain}
        onChange={(k) => setDomain(k as AdvisorDomainKey)}
      />

      {spec && (
        <p className="px-1 text-sm text-gray-500 dark:text-gray-400">{spec.description}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── A conversa ────────────────────────────────────────────── */}
        <Surface className="flex flex-col p-4 sm:p-5">
          <div className="min-h-[240px] flex-1 space-y-4">
            {chat.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pergunta o que quiseres — ou começa por uma destas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGESTOES[domain].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void perguntar(s)}
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-white/[0.08] dark:text-gray-400"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-400 px-4 py-2.5 text-sm text-gray-950'
                    : 'max-w-[95%] rounded-2xl rounded-bl-sm bg-gray-50 px-4 py-3 dark:bg-white/[0.04]'
                }
              >
                {m.role === 'user' ? m.content : <Markdown text={m.content} />}
              </div>
            ))}

            {isAsking && (
              <p className="text-sm text-gray-400 dark:text-gray-500">A pensar…</p>
            )}
            <div ref={fimDoChat} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void perguntar(pergunta)}
              placeholder="Escreve a tua pergunta…"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <Button
              type="button"
              size="sm"
              disabled={isAsking || !pergunta.trim()}
              onClick={() => void perguntar(pergunta)}
            >
              Perguntar
            </Button>
          </div>

          {/*
            Ver os números que o modelo recebeu. Está aqui para se poder
            desconfiar: uma resposta sobre dinheiro que não deixa ver de onde
            partiu pede fé, e fé não é o que se quer de um ecrã de contas.
          */}
          {contexto && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setVerContexto((v) => !v)}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {verContexto ? 'Esconder' : 'Ver'} os números que ele usou
              </button>
              {verContexto && (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
                  {contexto}
                </pre>
              )}
            </div>
          )}
        </Surface>

        {/* ── Planos ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Surface className="p-4">
            <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white">
              Um plano com fases
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Fica gravado com os números de que partiu — para daqui a um mês
              ainda se perceber porque é que dizia aquilo.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              disabled={isPlanning}
              onClick={async () => {
                try {
                  const p = await makePlan(domain, pergunta.trim() || undefined);
                  setPlanoAberto(p);
                  setPergunta('');
                  recarregarPlanos();
                  toast.success('Plano criado.');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Não foi possível criar o plano.');
                }
              }}
            >
              {isPlanning ? 'A escrever…' : 'Fazer-me um plano'}
            </Button>
          </Surface>

          {planos.length > 0 && (
            <Surface className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Planos guardados
              </p>
              <ul className="space-y-1">
                {planos.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => getPlan(p.id).then(setPlanoAberto).catch(() => {})}
                      className="min-w-0 flex-1 truncate text-left text-sm text-gray-700 transition-colors hover:text-brand-500 dark:text-gray-300"
                    >
                      {p.question || 'Plano geral'}
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Apagar plano"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Apagar o plano?',
                          message: 'O plano desaparece. Os teus números ficam como estão.',
                          danger: true,
                          confirmText: 'Apagar',
                        });
                        if (!ok) return;
                        await deletePlan(p.id);
                        if (planoAberto?.id === p.id) setPlanoAberto(null);
                        recarregarPlanos();
                      }}
                      className="shrink-0 text-gray-400 transition-colors hover:text-error-500"
                    >
                      <i className="fas fa-trash-can text-xs" />
                    </button>
                  </li>
                ))}
              </ul>
            </Surface>
          )}
        </div>
      </div>

      {planoAberto && (
        <Surface className="p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
                {planoAberto.question || 'Plano geral'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(planoAberto.createdAt).toLocaleString('pt-PT')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlanoAberto(null)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              fechar
            </button>
          </div>
          <Markdown text={planoAberto.content} />
        </Surface>
      )}

      {dialog}
    </PageShell>
  );
}
