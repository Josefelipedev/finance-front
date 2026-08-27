import Alert from '../ui/alert/Alert';
import { currencyOption } from '../../utils/currency';

interface Props {
  /** Moedas que não foi possível converter (de `unconvertibleCurrencies`). */
  currencies: string[];
  /**
   * Alguma conversão usou a taxa mais antiga que temos, por o movimento ser
   * anterior ao histórico. O total existe, mas é aproximado.
   */
  outOfRange?: boolean;
  /** A data da taxa usada, quando se sabe — dá-lhe contexto. */
  rateDate?: string | null;
}

/**
 * Mostrado no lugar de um total quando faltam as taxas de câmbio.
 *
 * Somar sem converter dá um número plausível e errado — medido em produção:
 * 5.345,29 € onde o valor real era 919,10 €. Entre um total errado e nenhum
 * total, nenhum total é a resposta honesta.
 *
 * O segundo caso é mais subtil e não esconde nada: o valor foi convertido, mas
 * com uma taxa de **fora do intervalo** — o movimento é anterior ao histórico
 * que temos. Medido em produção: um lançamento de 100.000 Kz em junho, antes de
 * existir taxa de kwanza, aparecia com o mesmo número e a mesma confiança de um
 * de agosto. O total continua à vista; o que muda é passar a dizer-se que é
 * aproximado.
 */
export default function MixedCurrencyWarning({
  currencies,
  outOfRange = false,
  rateDate = null,
}: Props) {
  if (currencies.length) {
    const nomes = currencies.map((c) => currencyOption(c).code).join(', ');
    return (
      <Alert
        variant="warning"
        title={`Sem taxas de câmbio para ${nomes}`}
        message="Não dá para somar moedas diferentes sem converter, por isso o total fica escondido. Recarregue a página daqui a pouco."
      />
    );
  }

  if (outOfRange) {
    return (
      <Alert
        variant="info"
        title="Valores aproximados"
        message={
          rateDate
            ? `Há movimentos anteriores ao nosso histórico de câmbio: foram convertidos com a taxa de ${rateDate}, a mais antiga que temos.`
            : 'Há movimentos anteriores ao nosso histórico de câmbio: foram convertidos com a taxa mais antiga que temos.'
        }
      />
    );
  }

  return null;
}
