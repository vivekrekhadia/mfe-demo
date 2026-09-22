import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "anchor"
  | "bed"
  | "utensils"
  | "credit-card"
  | "bell"
  | "user"
  | "chevron-left"
  | "info";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

// Original, hand-drawn 24x24 stroke icons — not sourced from any icon
// library or font. Kept deliberately small (one set, one place) so every
// app can share consistent iconography without adding an external icon
// package or a CDN font (this workspace ships everything it needs at
// build time, offline — see README "Why offline works").
const PATHS: Record<IconName, ReactNode> = {
  anchor: (
    <>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="21" />
      <path d="M6 12h12" />
      <path d="M5 12c0 4 2.8 7.2 7 9c4.2-1.8 7-5 7-9" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M3 18v2" />
      <path d="M21 18v2" />
      <path d="M3 13V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v6a2 2 0 0 0 4 0V3" />
      <line x1="8" y1="3" x2="8" y2="21" />
      <path d="M17 3v6c-1.7 0-3 1.3-3 3v0c0 .6.4 1 1 1h2" />
      <line x1="17" y1="3" x2="17" y2="21" />
    </>
  ),
  "credit-card": (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="10.5" x2="21" y2="10.5" />
      <line x1="6.5" y1="15" x2="10.5" y2="15" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.8 1.3 5 1.3 5H4.7S6 14.3 6 10.5Z" />
      <path d="M10.3 19a1.8 1.8 0 0 0 3.4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
  "chevron-left": <path d="M14.5 5.5 8 12l6.5 6.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.75" r="0.25" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
