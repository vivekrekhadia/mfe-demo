import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "accent";
}

const TONE_CLASS: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "ds-badge-neutral",
  success: "ds-badge-success",
  accent: "ds-badge-accent",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return <span className={["ds-badge", TONE_CLASS[tone], className].filter(Boolean).join(" ")} {...props} />;
}
