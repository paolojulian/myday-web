export function toCurrency(
  amount: number,
): string {
  // TODO: Add support for different locales
  const locale = "en-PH"; // Default locale for PHP currency formatting
  const currency = "PHP"; // Default currency for PHP

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}