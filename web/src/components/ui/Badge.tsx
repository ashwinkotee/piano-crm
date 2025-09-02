import type { ReactNode } from "react";
export default function Badge({ tone="muted", children }:{ tone?: "ok"|"warn"|"danger"|"muted"; children: ReactNode }) {
  const cls =
    tone === "ok" ? "bg-mint-100 text-mint-600"
    : tone === "warn" ? "bg-amberish-100 text-amberish-600"
    : tone === "danger" ? "bg-rosey-100 text-rosey-600"
    : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
