// These modules only exist at runtime, assembled by the Module Federation
// plugin from the `remotes` map in rspack.config.mjs — there is no local
// source file for the type checker to find, so we declare their shape by
// hand to match each MFE's `exposes` config.
//
// Deliberately no top-level import/export in this file: that would make it
// an ES module, turning these `declare module` blocks into *augmentations*
// of already-existing modules instead of brand-new ambient ones.
declare module "bookings/BookingsApp" {
  const BookingsApp: import("react").ComponentType;
  export default BookingsApp;
}
declare module "dining/DiningApp" {
  const DiningApp: import("react").ComponentType;
  export default DiningApp;
}
declare module "payment/PaymentApp" {
  const PaymentApp: import("react").ComponentType;
  export default PaymentApp;
}
declare module "signin/SignInApp" {
  const SignInApp: import("react").ComponentType;
  export default SignInApp;
}
