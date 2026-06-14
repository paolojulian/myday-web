import { describe, expect, it } from 'vitest';
import { getWarrantyExpiryStatus } from './warranty.utils';

const NOW = new Date('2026-06-14T12:00:00');

describe('getWarrantyExpiryStatus', () => {
  it('reports no date', () => {
    expect(getWarrantyExpiryStatus(null, NOW)).toEqual({
      label: 'No expiry date',
      tone: 'none',
    });
  });

  it('reports expired for a past date', () => {
    const status = getWarrantyExpiryStatus(new Date('2026-06-01'), NOW);
    expect(status.tone).toBe('expired');
    expect(status.label).toBe('Expired');
  });

  it('reports expires today', () => {
    const status = getWarrantyExpiryStatus(new Date('2026-06-14'), NOW);
    expect(status).toEqual({ label: 'Expires today', tone: 'soon' });
  });

  it('reports days left within the soon threshold', () => {
    const status = getWarrantyExpiryStatus(new Date('2026-06-20'), NOW);
    expect(status).toEqual({ label: 'Expires in 6 days', tone: 'soon' });
  });

  it('singularizes one day', () => {
    const status = getWarrantyExpiryStatus(new Date('2026-06-15'), NOW);
    expect(status.label).toBe('Expires in 1 day');
  });

  it('reports a far-off date with the formatted day', () => {
    const status = getWarrantyExpiryStatus(new Date('2027-01-01'), NOW);
    expect(status).toEqual({ label: 'Expires Jan 1, 2027', tone: 'ok' });
  });
});
