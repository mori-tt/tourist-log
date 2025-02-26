import React from "react";
import { useFormContext, Controller } from "react-hook-form";

// Define the props for the component
interface FormItemWrapperProps {
  name: string;
  label?: string;
  rules?: any;
  children: (params: { field: any }) => React.ReactNode;
}

export default function FormItemWrapper({
  name,
  label,
  rules,
  children,
}: FormItemWrapperProps) {
  // Use the form context to get control and errors
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => <div>{children({ field })}</div>}
      />
      {error && (
        <span className="text-red-600 text-xs mt-1 block">
          {typeof error.message === "string"
            ? error.message
            : "入力エラーがあります"}
        </span>
      )}
    </div>
  );
}
