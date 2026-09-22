import type { ComponentType } from "react";

type RemoteModule = { default: ComponentType };

// These specifiers ("bookings/BookingsApp" etc.) must stay as literal
// string arguments to import() — the Module Federation plugin rewrites
// them at build time based on the `remotes` map in rspack.config.mjs. The
// actual host/path each one resolves to is decided at RUNTIME (see the
// dynamic-remote scripts in rspack.config.mjs), not here.
export const importBookings = (): Promise<RemoteModule> => import("bookings/BookingsApp");
export const importDining = (): Promise<RemoteModule> => import("dining/DiningApp");
export const importPayment = (): Promise<RemoteModule> => import("payment/PaymentApp");
export const importSignin = (): Promise<RemoteModule> => import("signin/SignInApp");
