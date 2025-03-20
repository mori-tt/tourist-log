import React from "react";
import { Control, useFormState, FieldValues } from "react-hook-form";

interface FormItemWrapperProps<TFieldValues extends FieldValues = FieldValues> {
  name: string;
  control: Control<TFieldValues>;
  children: React.ReactNode;
  label?: string;
}

export const FormItemWrapper = <
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  control,
  children,
  label,
}: FormItemWrapperProps<TFieldValues>) => {
  const { errors } = useFormState({
    control,
  });
  const error = errors[name];

  return (
    <div className="w-full mb-4">
      {label && (
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor={name}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-red-500 text-xs italic mt-1">
          {error.message?.toString()}
        </p>
      )}
    </div>
  );
};
