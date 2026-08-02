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
