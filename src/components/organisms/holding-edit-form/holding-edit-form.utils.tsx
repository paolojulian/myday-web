import AppTextInput from "@/components/atoms/app-text-input";
import { InvestmentHolding } from "@/repository";
import dayjs from "dayjs";
import { useState } from "react";

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

type TimelockDateInputProps = {
  id: string;
  label: string;
  value: string;
  onChangeText: (value?: string | number) => void;
};

export const TimelockDateInput = ({
  id,
  label,
  value,
  onChangeText,
}: TimelockDateInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AppTextInput
      id={id}
      label={label}
      type={isFocused || !!value ? "date" : "text"}
      value={value}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChangeText={onChangeText}
    />
  );
};
