import * as React from "react";

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({
  className = "",
  type = "text",
  ...props
}: TextInputProps) {
  return (
    <input
      type={type}
      {...props}
      className={
        "w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-sm text-green-900 placeholder:text-green-700/60 focus:outline-none focus:ring-2 focus:ring-green-200 " +
        className
      }
    />
  );
}
