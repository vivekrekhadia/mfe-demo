import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success";
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  const toneClass = tone === "success" ? "ds-badge-success" : "ds-badge-neutral";
  return <span className={["ds-badge", toneClass, className].filter(Boolean).join(" ")} {...props} />;
}
