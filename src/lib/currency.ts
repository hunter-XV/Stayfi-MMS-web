/**
 * DZD currency formatting — Latin numerals, no decimals.
 */

const formatter = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatDZD(amount: number): string {
  return formatter.format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-DZ").format(n);
}
