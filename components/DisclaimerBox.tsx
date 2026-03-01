import type { ReactNode } from "react";

export default function DisclaimerBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-100 p-4 text-sm text-green-900">
      {children}
    </div>
  );
}
