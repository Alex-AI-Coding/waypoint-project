"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function PageEnter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={[
        "transition-all duration-500 ease-out motion-reduce:transition-none",
        entered
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}