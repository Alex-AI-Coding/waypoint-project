import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export default function Card({
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[1.75rem] border border-black/6 bg-white/80 p-4 shadow-sm backdrop-blur",
        "dark:border-white/8 dark:bg-[#272c34]/88",
        "sm:p-5",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}