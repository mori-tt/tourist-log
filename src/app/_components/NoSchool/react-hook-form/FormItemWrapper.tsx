import { useFormContext, Controller } from "react-hook-form";
import React from "react";

interface FormItemWrapperProps {
  name: string;
  control: any;
  children: React.ReactNode;
  label?: string;
  labelClassName?: string;
  required?: boolean;
}

export function FormItemWrapper({
  name,
  control,
  children,
  label,
  labelClassName = "",
  required = false,
}: FormItemWrapperProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className="mb-4">
      {label && (
        <label className={`block mb-2 text-sm font-medium ${labelClassName}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message?.toString() || "入力が必要です"}
        </p>
      )}
    </div>
  );
}
