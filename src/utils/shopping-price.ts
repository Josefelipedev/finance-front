/**
 * Quanto conta um item da lista de compras — o espelho do `item-price.ts` da API.
 *
 * Havia dois preços por item e o do scraper ganhava (`scrapedPrice ?? price`),
 * escrito à mão em seis sítios só neste repositório. A linha e o total
 * discordavam: o ecrã mostrava o "pão" a 10,00 € — o que a pessoa escreveu — e
 * o total dizia 0,15 €, que era o preço do Pingo Doce cinco semanas antes.
 * Fechar a compra lançava os 0,15 € no livro-razão.
 *
 * ## Preço unitário × quantidade
 *
 * `price` é o preço de UMA unidade. Até 27/ago/2026 era o valor da linha e a
 * `quantity` não entrava em conta nenhuma: três pães a 10,00 € somavam 10,00 €.
 * O scraper sempre devolveu o preço de um produto — uma unidade — o que tornava
 * a incoerência maior ainda quando era ele a preencher. Quem soma usa o
 * `lineTotal`.
 *
 * Quem manda é o preço **escrito à mão**: é uma afirmação da pessoa sobre o
 * dinheiro dela. O do scraper continua à vista na linha, como referência, e
 * preenche quando não há preço escrito — `price` chega a **0** (não a `null`)
 * quando o formulário é submetido sem se tocar no campo, por isso o teste é
 * `> 0`.
 */
export type PricedItem = {
  price?: number | null;
  scrapedPrice?: number | null;
  scrapedCurrency?: string | null;
  scrapedAt?: string | null;
};

/**
 * A partir de quantos dias o preço de um supermercado deixa de dizer alguma
 * coisa sobre hoje. As promoções mudam à semana; o preço que estava em
 * produção tinha 39 dias.
 */
export const MAX_SCRAPED_AGE_DAYS = 7;

/** Preço de UMA unidade. */
export function itemPrice(item: PricedItem): number {
  if (item.price != null && item.price > 0) return item.price;
  return item.scrapedPrice ?? item.price ?? 0;
}

/**
 * O que a linha vale: preço unitário × quantidade. Quantidade ausente, zero ou
 * negativa conta como 1 — melhor assumir o óbvio do que encolher um total por
 * causa de um campo mal preenchido.
 */
export function lineTotal(item: PricedItem & { quantity?: number | null }): number {
  const quantity = item.quantity != null && item.quantity > 0 ? item.quantity : 1;
  return itemPrice(item) * quantity;
}

/** true quando o valor deste item veio do scraper, não da pessoa. */
export function isEstimatedPrice(item: PricedItem): boolean {
  return (
    !(item.price != null && item.price > 0) &&
    item.scrapedPrice != null &&
    item.scrapedPrice > 0
  );
}

/**
 * A moeda em que esta linha está expressa.
 *
 * O preço escrito à mão é na moeda de quem escreveu — a app não tem moeda por
 * item. O do scraper é na do país da loja, que pode não ser nenhuma das duas:
 * os supermercados ligados hoje são portugueses e falam euros.
 */
export function lineCurrency(item: PricedItem, fallback?: string | null): string | null | undefined {
  if (isEstimatedPrice(item) && item.scrapedCurrency) return item.scrapedCurrency;
  return fallback;
}

/** Há quantos dias este preço foi lido na loja. `null` se nunca foi. */
export function scrapedAgeInDays(item: PricedItem, now: Date = new Date()): number | null {
  if (!item.scrapedAt) return null;
  const lido = new Date(item.scrapedAt).getTime();
  if (Number.isNaN(lido)) return null;
  return Math.floor((now.getTime() - lido) / 86_400_000);
}

/**
 * true quando o valor desta linha é um preço de loja velho de mais para se
 * apresentar como se fosse de hoje. Continua a contar — é a única estimativa
 * que há —, mas quem o mostra tem de o dizer.
 */
export function isStalePrice(item: PricedItem, now: Date = new Date()): boolean {
  if (!isEstimatedPrice(item)) return false;
  const idade = scrapedAgeInDays(item, now);
  return idade != null && idade > MAX_SCRAPED_AGE_DAYS;
}
