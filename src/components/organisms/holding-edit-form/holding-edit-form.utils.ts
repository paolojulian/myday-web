import { InvestmentHolding } from "@/repository";
import dayjs from "dayjs";

export type TimelockMode = "none" | "locked";

export const timelockOptions = [
  { label: "No timelock", value: "none" },
  { label: "Lock until date", value: "locked" },
];

export function toNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasValidTimelock(mode: TimelockMode, value: string): boolean {
  return mode === "none" || !!value.trim();
}

export function isHoldingTimelocked(holding: InvestmentHolding): boolean {
  if (!holding.timelock_until) return false;
  return dayjs(holding.timelock_until).isAfter(dayjs());
}
