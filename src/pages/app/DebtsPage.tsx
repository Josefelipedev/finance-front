import PageShell from '../../components/common/PageShell';
import DebtsView from '../../components/finance-metrics/debts/DebtsView';

/**
 * Dívidas — e a data em que deixam de existir.
 *
 * As Contas a Pagar já mostravam as prestações; o que faltava era o outro lado
 * da mesma coisa: o saldo que fica depois delas, o juro que corre em cima, e
 * por que ordem atacar quando o dinheiro não chega para tudo. Somar 48
 * ocorrências futuras nunca respondeu a "quando é que isto acaba?".
 */
export default function DebtsPage() {
  return (
    <PageShell
      title="Dívidas"
      description="O que se deve, por que ordem atacar, e quando ficas livre"
    >
      <DebtsView />
    </PageShell>
  );
}
