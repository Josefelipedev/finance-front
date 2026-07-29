import Alert from '../ui/alert/Alert';
import { currencyOption } from '../../utils/currency';

interface Props {
  /** Moedas que não foi possível converter (de `unconvertibleCurrencies`). */
  currencies: string[];
}

/**
 * Mostrado no lugar de um total quando faltam as taxas de câmbio.
 *
 * Somar sem converter dá um número plausível e errado — medido em produção:
 * 5.345,29 € onde o valor real era 919,10 €. Entre um total errado e nenhum
 * total, nenhum total é a resposta honesta.
 */
export default function MixedCurrencyWarning({ currencies }: Props) {
  if (!currencies.length) return null;
  const nomes = currencies.map((c) => currencyOption(c).code).join(', ');

  return (
    <Alert
      variant="warning"
      title={`Sem taxas de câmbio para ${nomes}`}
      message="Não dá para somar moedas diferentes sem converter, por isso o total fica escondido. Recarregue a página daqui a pouco."
    />
  );
}
