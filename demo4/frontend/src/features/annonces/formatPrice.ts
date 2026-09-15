const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** 1250 → "1 250 €" (narrow no-break spaces, as leboncoin displays prices). */
export function formatPrice(price: number) {
  return priceFormatter.format(price)
}
