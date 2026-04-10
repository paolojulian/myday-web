import { clearCurrencyFormatting, formatCurrency } from './formatters.utils';

describe('formatCurrency', () => {
  it('formats a plain integer string', () => {
    expect(formatCurrency('1000')).toBe('₱ 1,000');
  });

  it('formats a large number with commas', () => {
    expect(formatCurrency('1234567')).toBe('₱ 1,234,567');
  });

  it('handles a decimal value', () => {
    expect(formatCurrency('1000.50')).toBe('₱ 1,000.50');
  });

  it('truncates to 2 decimal places', () => {
    expect(formatCurrency('1000.999')).toBe('₱ 1,000.99');
  });

  it('returns empty string for an empty input', () => {
    expect(formatCurrency('')).toBe('');
  });

  it('preserves a trailing decimal point while typing', () => {
    expect(formatCurrency('100.')).toBe('₱ 100.');
  });

  it('handles a bare decimal point', () => {
    expect(formatCurrency('.')).toBe('₱ 0.');
  });

  it('strips existing ₱ symbols before re-formatting', () => {
    expect(formatCurrency('₱ 500')).toBe('₱ 500');
  });

  it('strips commas before re-formatting', () => {
    expect(formatCurrency('1,000')).toBe('₱ 1,000');
  });

  it('handles negative values', () => {
    expect(formatCurrency('-500')).toBe('-₱ 500');
  });

  it('returns "-" for a lone minus sign', () => {
    expect(formatCurrency('-')).toBe('-');
  });

  it('returns empty string for non-numeric input', () => {
    expect(formatCurrency('abc')).toBe('');
  });
});

describe('clearCurrencyFormatting', () => {
  it('removes the ₱ symbol', () => {
    expect(clearCurrencyFormatting('₱ 1,000')).toBe('1000');
  });

  it('removes commas', () => {
    expect(clearCurrencyFormatting('1,234,567')).toBe('1234567');
  });

  it('preserves decimal points', () => {
    expect(clearCurrencyFormatting('₱ 1,000.50')).toBe('1000.50');
  });

  it('preserves negative sign', () => {
    expect(clearCurrencyFormatting('-₱ 500')).toBe('-500');
  });

  it('returns an empty string for empty input', () => {
    expect(clearCurrencyFormatting('')).toBe('');
  });
});
