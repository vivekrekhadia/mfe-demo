import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "ds-button-primary" : "ds-button-secondary";
  return <button className={["ds-button", variantClass, className].filter(Boolean).join(" ")} {...props} />;
}
