import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { DateRangeInput } from "./DateRange";

type ControlledDateRangeInputProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  id?: string;
};

export const ControlledDateRangeInput = <T extends FieldValues>({
  name,
  control,
  label = "Select campaign range",
  id = "date-range",
}: ControlledDateRangeInputProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DateRangeInput
          {...field}
          id={id}
          label={label}
          value={
            field.value
              ? {
                  from: field.value[0] ?? undefined,
                  to: field.value[1] ?? undefined,
                }
              : undefined
          }
          onChange={(range) => {
            field.onChange([range?.from ?? null, range?.to ?? null]);
          }}
          message={fieldState.error?.message}
          messageType="error"
        />
      )}
    />
  );
};
