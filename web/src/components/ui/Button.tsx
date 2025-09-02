import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
};
export default function Button({ variant="primary", size="md", className="", children, ...rest }: Props) {
  const base = "inline-flex items-center justify-center font-medium transition shadow-sm rounded-xl";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2";
  const style =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-soft"
      : variant === "secondary"
      ? "border border-slate-300 bg-white hover:bg-slate-50"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "hover:bg-slate-100";
  return (
    <button className={`${base} ${sizes} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
