// Same values as the CSS custom properties in ./styles.css, for the rare
// case a consumer needs a raw value in JS/TS (e.g. an inline style) rather
// than a class. Keep the two in sync by hand — there are few enough tokens
// that a build step to generate one from the other isn't worth it yet.
export const tokens = {
  color: {
    navy: "#0b1f33",
    navyLight: "#12314f",
    background: "#f4f7fa",
    success: "#2f6f3f",
    successBg: "#eef6ee",
    danger: "#a12727",
    dangerBg: "#fdf1f1",
  },
  radius: {
    sm: "6px",
    md: "10px",
    pill: "999px",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
  font: {
    sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
} as const;
