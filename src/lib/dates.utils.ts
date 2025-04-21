import dayjs from 'dayjs';

export function getStartAndEndOfMonth(date: Date) {
  const startOfMonth = dayjs(date).startOf('month').toDate();
  const endOfMonth = dayjs(date).endOf('month').toDate();

  return {
    startOfMonth,
    endOfMonth,
  };
}
