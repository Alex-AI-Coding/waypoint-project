import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      {children}
    </div>
  );
}
