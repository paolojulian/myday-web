import { toCurrency } from './currency.utils';

describe('toCurrency', () => {
  it('formats a whole number with the Philippine Peso symbol', () => {
    const result = toCurrency(1000);
    expect(result).toContain('₱');
    expect(result).toContain('1,000');
  });

  it('formats zero', () => {
    const result = toCurrency(0);
    expect(result).toContain('₱');
    expect(result).toContain('0');
  });

  it('formats large numbers with commas', () => {
    const result = toCurrency(1234567);
    expect(result).toContain('1,234,567');
  });

  it('does not add unnecessary decimals for whole numbers', () => {
    const result = toCurrency(500);
    // minimumFractionDigits: 0 — should not show .00
    expect(result).not.toContain('.00');
  });

  it('handles negative amounts', () => {
    const result = toCurrency(-500);
    expect(result).toContain('500');
    // Negative sign or parentheses depending on locale
    const hasNegativeIndicator = result.includes('-') || result.includes('(');
    expect(hasNegativeIndicator).toBe(true);
  });
});
