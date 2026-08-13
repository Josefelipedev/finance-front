/**
 * Os dois únicos tipos que se somam.
 *
 * Os ecrãs faziam `type === 'income' ? ganhos : despesas` — ou seja, **qualquer
 * tipo desconhecido contava como despesa**. O servidor faz o contrário: filtra
 * `type: { in: ['income','expense'] }` e deixa de fora o que não sabe somar
 * (ponto 15 da revisão). Com os dois critérios em vigor ao mesmo tempo, os
 * mesmos dados dariam números diferentes conforme o ecrã — e o da web seria
 * sempre o das despesas infladas.
 *
 * Um lançamento com um tipo estranho não é uma despesa: é um lançamento que não
 * se sabe somar. Fica de fora, como no servidor.
 */
export type CountableType = 'income' | 'expense';

export function countableType(type?: string | null): CountableType | null {
  return type === 'income' || type === 'expense' ? type : null;
}

/**
 * Transferência: dinheiro que saiu do bolso disponível **sem ter sido gasto** —
 * um depósito numa meta, uma passagem entre contas próprias.
 *
 * Fica fora de todos os totais (o `countableType` já a exclui, como exclui
 * qualquer tipo que não se saiba somar), mas ao contrário de um tipo estranho
 * esta é uma coisa que a app cria de propósito e tem de saber mostrar. Sem isto,
 * um depósito de 250 € aparecia na lista rotulado "Despesa" com um menos à
 * frente, que é exatamente a leitura que se quis evitar.
 */
export function isTransfer(type?: string | null): boolean {
  return type === 'transfer';
}

/** O rótulo de um lançamento na lista. */
export function typeLabel(type?: string | null): string {
  if (type === 'income') return 'Receita';
  if (type === 'transfer') return 'Transferência';
  return 'Despesa';
}

/**
 * O sinal à frente do valor. A transferência leva `−` porque o dinheiro saiu
 * mesmo da conta — o que ela não é, é despesa.
 */
export function typeSign(type?: string | null): '+' | '-' {
  return type === 'income' ? '+' : '-';
}
