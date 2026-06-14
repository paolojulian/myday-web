import dayjs from 'dayjs';

export type WarrantyExpiryTone = 'expired' | 'soon' | 'ok' | 'none';

export type WarrantyExpiryStatus = {
  label: string;
  tone: WarrantyExpiryTone;
};

const SOON_THRESHOLD_DAYS = 30;

/**
 * Human-readable expiration status for a warranty, relative to `now`.
 * - no date        → tone 'none'
 * - already passed  → tone 'expired'
 * - within 30 days  → tone 'soon' ("Expires in N days")
 * - further out     → tone 'ok'   ("Expires MMM D, YYYY")
 */
export const getWarrantyExpiryStatus = (
  expirationDate: Date | null | undefined,
  now: Date = new Date()
): WarrantyExpiryStatus => {
  if (!expirationDate) {
    return { label: 'No expiry date', tone: 'none' };
  }

  const today = dayjs(now).startOf('day');
  const expiry = dayjs(expirationDate).startOf('day');
  const daysLeft = expiry.diff(today, 'day');

  if (daysLeft < 0) {
    return { label: 'Expired', tone: 'expired' };
  }

  if (daysLeft === 0) {
    return { label: 'Expires today', tone: 'soon' };
  }

  if (daysLeft <= SOON_THRESHOLD_DAYS) {
    return {
      label: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      tone: 'soon',
    };
  }

  return { label: `Expires ${expiry.format('MMM D, YYYY')}`, tone: 'ok' };
};
