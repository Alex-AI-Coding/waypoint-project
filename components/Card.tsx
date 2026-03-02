import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background text-foreground shadow-sm">
      {children}
    </div>
  );
}