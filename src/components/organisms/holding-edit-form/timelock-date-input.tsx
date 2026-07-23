import AppTextInput from "@/components/atoms/app-text-input";
import { useState } from "react";

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
