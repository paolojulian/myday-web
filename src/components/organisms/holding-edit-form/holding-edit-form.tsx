import { AppButton } from "@/components/atoms/app-button";
import { AppPicker } from "@/components/atoms/app-picker";
import AppTextInput from "@/components/atoms/app-text-input";
import { calculateReturnPercent } from "@/lib/investment.utils";
import { InvestmentHolding } from "@/repository";
import { FormEvent } from "react";
import {
  TimelockMode,
  hasValidTimelock,
  isHoldingTimelocked,
  timelockOptions,
  toNumber,
} from "./holding-edit-form.utils";
import { TimelockDateInput } from "./timelock-date-input";

export type HoldingActionMode =
  | "actions"
  | "details"
  | "price"
  | "withdraw"
  | "balance"
  | "correct";

export type HoldingEditFormState = {
  name: string;
  symbol: string;
  quantity: string;
  currentPrice: string;
  currentValue: string;
  correctedValue: string;
  notes: string;
  withdrawalAmount: string;
  withdrawalDate: string;
  expectedAnnualReturnPercent: string;
  timelockMode: TimelockMode;
  timelockUntil: string;
};

type HoldingEditFormProps = {
  holding: InvestmentHolding;
  isMarket: boolean;
  mode: HoldingActionMode;
  form: HoldingEditFormState;
  isPending: boolean;
  onModeChange: (mode: HoldingActionMode) => void;
  onChange: (key: keyof HoldingEditFormState, value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmitDetails: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitMarketPrice: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSimpleBalance: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitCorrectValue: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSimpleWithdrawal: (event: FormEvent<HTMLFormElement>) => void;
};

export const HoldingEditForm = ({
  holding,
  isMarket,
  mode,
  form,
  isPending,
  onModeChange,
  onChange,
  onCancel,
  onDelete,
  onSubmitDetails,
  onSubmitMarketPrice,
  onSubmitSimpleBalance,
  onSubmitCorrectValue,
  onSubmitSimpleWithdrawal,
}: HoldingEditFormProps) => {
  const isLocked = isHoldingTimelocked(holding);

  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3">
      {mode === "actions" && (
        <div className="grid grid-cols-2 gap-2">
          <AppButton
            type="button"
            size="sm"
            variant="outlined"
            onClick={() => onModeChange("details")}
          >
            Details
          </AppButton>
          <AppButton
            type="button"
            size="sm"
            variant="outlined"
            onClick={() => onModeChange(isMarket ? "price" : "withdraw")}
          >
            {isMarket ? "Price" : "Withdraw"}
          </AppButton>
          {!isMarket && (
            <AppButton
              type="button"
              size="sm"
              variant="outlined"
              onClick={() => onModeChange("balance")}
            >
              Correct
            </AppButton>
          )}
          <AppButton
            type="button"
            size="sm"
            variant="outlined"
            onClick={() => onModeChange("correct")}
          >
            Correct value
          </AppButton>
          <AppButton
            type="button"
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={isPending || isLocked}
          >
            Delete
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            className="col-span-2"
            onClick={onCancel}
          >
            Cancel
          </AppButton>
        </div>
      )}

      {mode === "details" && (
        <form onSubmit={onSubmitDetails} className="grid grid-cols-1 gap-3">
          <AppTextInput
            id={`edit-holding-name-${holding.id}`}
            label="Name"
            value={form.name}
            onChangeText={(value) => onChange("name", String(value || ""))}
            required
          />

          {isMarket ? (
            <>
              <AppTextInput
                id={`edit-holding-symbol-${holding.id}`}
                label="Investment"
                value={form.symbol}
                onChangeText={(value) =>
                  onChange("symbol", String(value || ""))
                }
                required
              />
            </>
          ) : (
            <AppTextInput
              id={`edit-holding-rate-${holding.id}`}
              label="Expected annual %"
              inputMode="decimal"
              placeholder="Optional"
              value={form.expectedAnnualReturnPercent}
              onChangeText={(value) =>
                onChange("expectedAnnualReturnPercent", String(value || ""))
              }
            />
          )}

          {isLocked ? (
            <TimelockDateInput
              id={`edit-holding-timelock-${holding.id}`}
              label="Extend timelock date"
              value={form.timelockUntil}
              onChangeText={(value) =>
                onChange("timelockUntil", String(value || ""))
              }
            />
          ) : (
            <>
              <AppPicker
                id={`edit-holding-timelock-mode-${holding.id}`}
                label="Timelock"
                options={timelockOptions}
                value={form.timelockMode}
                onChange={(value) => onChange("timelockMode", value)}
              />
              {form.timelockMode === "locked" && (
                <TimelockDateInput
                  id={`edit-holding-timelock-${holding.id}`}
                  label="Timelock date"
                  value={form.timelockUntil}
                  onChangeText={(value) =>
                    onChange("timelockUntil", String(value || ""))
                  }
                />
              )}
            </>
          )}

          <AppButton
            type="submit"
            size="sm"
            disabled={
              isPending ||
              !form.name.trim() ||
              !hasValidTimelock(form.timelockMode, form.timelockUntil)
            }
          >
            Save Details
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            onClick={() => onModeChange("actions")}
          >
            Back
          </AppButton>
        </form>
      )}

      {mode === "price" && isMarket && (
        <form
          onSubmit={onSubmitMarketPrice}
          className="mt-3 grid grid-cols-1 gap-3"
        >
          <AppTextInput
            id={`edit-holding-price-${holding.id}`}
            label="Current price"
            inputMode="decimal"
            value={form.currentPrice}
            onChangeText={(value) =>
              onChange("currentPrice", String(value || ""))
            }
            required
          />
          <AppButton
            type="submit"
            size="sm"
            disabled={isPending || toNumber(form.currentPrice) <= 0}
          >
            Update Price
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            onClick={() => onModeChange("actions")}
          >
            Back
          </AppButton>
        </form>
      )}

      {mode === "withdraw" && !isMarket && (
        <form
          onSubmit={onSubmitSimpleWithdrawal}
          className="mt-3 grid grid-cols-1 gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <AppTextInput
              id={`edit-holding-withdrawal-${holding.id}`}
              label="Withdraw"
              inputMode="decimal"
              value={form.withdrawalAmount}
              onChangeText={(value) =>
                onChange("withdrawalAmount", String(value || ""))
              }
              required
            />
            <AppTextInput
              id={`edit-holding-withdrawal-date-${holding.id}`}
              label="Date"
              type="date"
              value={form.withdrawalDate}
              onChangeText={(value) =>
                onChange("withdrawalDate", String(value || ""))
              }
              required
            />
          </div>
          <AppButton
            type="submit"
            size="sm"
            disabled={
              isPending ||
              isLocked ||
              toNumber(form.withdrawalAmount) <= 0 ||
              toNumber(form.withdrawalAmount) > holding.current_value
            }
          >
            Log Withdrawal
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            onClick={() => onModeChange("actions")}
          >
            Back
          </AppButton>
        </form>
      )}

      {mode === "balance" && !isMarket && (
        <form
          onSubmit={onSubmitSimpleBalance}
          className="mt-3 grid grid-cols-1 gap-3"
        >
          <AppTextInput
            id={`edit-holding-value-${holding.id}`}
            label="Correct balance"
            inputMode="decimal"
            value={form.currentValue}
            onChangeText={(value) =>
              onChange("currentValue", String(value || ""))
            }
            required
          />
          <AppButton
            type="submit"
            size="sm"
            disabled={
              isPending ||
              toNumber(form.currentValue) <= 0 ||
              (isLocked && toNumber(form.currentValue) < holding.current_value)
            }
          >
            Save Balance Correction
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            onClick={() => onModeChange("actions")}
          >
            Back
          </AppButton>
        </form>
      )}

      {mode === "correct" && (
        <form
          onSubmit={onSubmitCorrectValue}
          className="mt-3 grid grid-cols-1 gap-3"
        >
          <AppTextInput
            id={`edit-holding-corrected-value-${holding.id}`}
            label="Corrected value"
            inputMode="decimal"
            value={form.correctedValue}
            onChangeText={(value) =>
              onChange("correctedValue", String(value || ""))
            }
            required
          />
          <AppTextInput
            id={`edit-holding-correction-note-${holding.id}`}
            label="Note"
            placeholder="Optional"
            value={form.notes}
            onChangeText={(value) => onChange("notes", String(value || ""))}
          />
          <p className="text-xs text-neutral-400">
            Gain/loss stays at{" "}
            {calculateReturnPercent(
              holding.current_value,
              holding.cost_basis,
            ).toFixed(1)}
            %
          </p>
          <AppButton
            type="submit"
            size="sm"
            disabled={
              isPending ||
              toNumber(form.correctedValue) <= 0 ||
              (isLocked && toNumber(form.correctedValue) < holding.current_value)
            }
          >
            Save Corrected Value
          </AppButton>
          <AppButton
            type="button"
            variant="outlined"
            size="sm"
            onClick={() => onModeChange("actions")}
          >
            Back
          </AppButton>
        </form>
      )}
    </div>
  );
};
