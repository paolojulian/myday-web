export const formatCurrency = (value: string): string => {
  // Remove any existing ₱ symbols, spaces, and commas, but keep decimal point and numbers
  const numericValue = value.replace(/[₱\s,]/g, '');

  if (!numericValue || numericValue === '') {
    return '';
  }

  // Allow typing decimal point
  if (numericValue === '.') {
    return '₱ 0.';
  }

  // Check if it ends with a decimal point (user is about to type decimals)
  const endsWithDecimal = numericValue.endsWith('.');

  // Split by decimal to handle integer and decimal parts separately
  const parts = numericValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with commas
  const number = parseInt(integerPart || '0', 10);
  if (isNaN(number)) {
    return '';
  }

  let formatted = `₱ ${number.toLocaleString('en-US')}`;

  // Add decimal point and decimal digits if present
  if (endsWithDecimal) {
    formatted += '.';
  } else if (decimalPart !== undefined) {
    // Limit to 2 decimal places
    formatted += '.' + decimalPart.slice(0, 2);
  }

  return formatted;
};

export const clearCurrencyFormatting = (value: string): string => {
  return value.replace(/[₱\s,]/g, '').trim();
};
