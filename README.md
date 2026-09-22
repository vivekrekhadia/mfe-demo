# Offline Micro Frontends for a Cruise Ship

A working proof-of-concept showing how a cruise ship can run a Module-Federation-based
micro-frontend application **entirely from its own local server, with zero internet
dependency at runtime** — while still supporting independent MFE releases, atomic
activation, and instant rollback, all delivered the only way a ship *can* receive
software: a bundle physically transferred when it reaches shore.

Everything in this repository has been built and exercised end-to-end (see
"Verification performed" at the bottom) — it is not a skeleton.

---

## 1. The problem this solves

A cruise ship is at sea for days or weeks. During the voyage:

- There is no reliable internet connectivity.
- The application (bookings, dining, payments, ...) must keep working anyway.
- New features still need to ship — just not while the ship is at sea.
- When the ship docks, it gets a window to receive new software.
- If a new release is bad, the crew needs to revert it *immediately*, without a rebuild.

This repo demonstrates the architecture that satisfies all of that using **Module
Federation** for runtime composition and a **local Ship Server** as the single source of
truth for what code runs, with no step anywhere that requires a cloud round-trip.

## 2. Architecture

```
                         SHORE                                    SHIP
  ┌─────────────────────────────────────────┐   ┌──────────────────────────────────────┐
  │  Developer commits code                  │   │                                      │
  │        │                                 │   │                                      │
  │        v                                 │   │                                      │
  │  CI/CD: pnpm ship:build <release>        │   │                                      │
  │     builds Shell + Bookings + Dining +   │   │                                      │
  │     Payment, stages releases/<release>/  │   │                                      │
  │        │                                 │   │                                      │
  │        v                                 │   │                                      │
  │  pnpm ship:package <release>             │   │                                      │
  │     -> ship-release-<release>.tar.gz     │   │                                      │
  │        + .sha256 checksum                │   │                                      │
  │        │                                 │   │                                      │
  │        v                                 │   │                                      │
  │  Physical transfer (USB drive, LAN sync, │──▶│  pnpm ship:deploy <release>          │
  │  satellite burst, whatever gets a file   │   │     validates the release, then      │
  │  from shore to ship)                     │   │     installs it immutably under      │
  │                                          │   │     mfe/releases/<release>/          │
  │                                          │   │        │                             │
  │                                          │   │        v                             │
  │                                          │   │  pnpm ship:activate <release>        │
  │                                          │   │     validates again, then atomically │
  │                                          │   │     rewrites config/mfe-manifest.json│
  │                                          │   │        │                             │
  │                                          │   │        v                             │
  │                                          │   │  ┌────────────────────────────────┐  │
  │                                          │   │  │           Ship Server           │  │
  │                                          │   │  │  (Express, serves everything    │  │
  │                                          │   │  │   below over plain HTTP, LAN)   │  │
  │                                          │   │  └────────────────────────────────┘  │
  │                                          │   │        │                             │
  │                                          │   │        v                             │
  │                                          │   │      Shell (browser)                 │
  │                                          │   │   fetches /config/mfe-manifest.json  │
  │                                          │   │        │                             │
  │                                          │   │  ┌─────┼─────┬─────────┐             │
  │                                          │   │  v     v     v         │             │
  │                                          │   │Bookings Dining Payment │             │
  │                                          │   │  MFE    MFE    MFE     │             │
  │                                          │   │  (loaded at runtime via Module       │
  │                                          │   │   Federation, from whatever URL      │
  │                                          │   │   the manifest currently points at)  │
  │                                          │   │                                      │
  │                                          │   │        NO INTERNET REQUIRED ─────X   │
  └─────────────────────────────────────────┘   └──────────────────────────────────────┘
```

### The pieces

| Piece | What it is | Where |
|---|---|---|
| **Shell** | The host application. Renders the nav, the active-release banner, and — based on the URL — routes to and mounts the matching MFE. | `apps/shell` |
| **Bookings / Dining / Payment MFEs** | Three independently built, independently deployable React apps, each exposing one component via Module Federation. | `apps/bookings-mfe`, `apps/dining-mfe`, `apps/payment-mfe` |
| **Ship Server** | A small Express server representing the ship's local/central server. Serves the Shell, every installed MFE release, and the active manifest. Nothing it does requires outbound internet access. | `apps/ship-server` |
| **Runtime manifest** | `/config/mfe-manifest.json` — the *only* thing that tells the Shell where each MFE currently lives. | `apps/ship-server/public/config/mfe-manifest.json` |
| **Release scripts** | Build, package, validate, deploy, activate, and roll back releases. | `scripts/` |
| **shared-types / shared-config** | The manifest's TypeScript contract and a couple of structural constants (the manifest path, the ship server's default port) — shared by the Shell and the scripts. | `packages/` |

## 3. Why each design decision exists

### Module Federation + a runtime manifest (not build-time imports)

The Shell's `rspack.config.mjs` declares three remotes by **name only**
(`bookings`, `dining`, `payment`). It never contains a URL. Each remote is configured
using Rspack/webpack's standard **dynamic remote** pattern: a `promise`-prefixed string
that Rspack's Module Federation runtime executes as literal JS the moment the Shell first
requests that remote's container — not at build time. That code reads
`window.__SHIP_MANIFEST__.mfes.<name>.url`, script-injects a `<script>` tag pointed at
that URL, and resolves once the remote's container (`window.<name>`) has registered
itself. `window.__SHIP_MANIFEST__` is populated once, at startup, by fetching
`/config/mfe-manifest.json` from the Ship Server (see the `dynamicRemote()` helper at the
top of `apps/shell/rspack.config.mjs`).

This is what makes the split between **build-time composition** and **runtime
composition** real, not just a diagram:

```
Build-time composition (NOT this project):        Runtime composition (this project):

  Shell build                                        Shell
    └── includes Bookings source                       │
        (rebuild Shell to change Bookings)              fetch /config/mfe-manifest.json
                                                        │
                                                        import("bookings/BookingsApp")
                                                        │
                                                        Rspack's MF runtime resolves the
                                                        "bookings" container by running the
                                                        dynamicRemote script, which reads
                                                        window.__SHIP_MANIFEST__ for the
                                                        URL — AT RUNTIME, never hard-coded
```

Swapping which release is active (`pnpm ship:activate`, `pnpm ship:rollback`) changes
what the Shell loads on the very next page refresh — **the Shell is never rebuilt or
redeployed to pick up a new MFE release.** That's Constraint 10 in the spec, and it's the
entire point of doing this with Module Federation instead of, say, static bundling.

**Why Rspack instead of Vite**: this project originally used Vite +
`@originjs/vite-plugin-federation`. That plugin is a capable but unofficial emulation of
the Module Federation protocol — it works, but it's a third-party shim (it even nests
`remoteEntry.js` under `dist/assets/` by default, requiring a manual `assetsDir`
workaround). Rspack ships an official, webpack-compatible `ModuleFederationPlugin` —
the reference implementation's actual runtime, not a re-implementation of it — with more
mature version/singleton negotiation and no such quirks (`remoteEntry.js` lands exactly
where `filename` says, full stop). It's also a straight drop-in for any team already
running webpack Module Federation, and dramatically faster to build than plain webpack.

### Route-based MFEs: the URL is the source of truth for which remote is mounted

`apps/shell/src/bootstrap.tsx` wraps the app in `<BrowserRouter>`, and
`apps/shell/src/App.tsx` maps three top-level paths straight to the three remotes:

```
/bookings  -> RemoteLoader(loader: importBookings)   (Route-based Micro Front Ends)
/dining    -> RemoteLoader(loader: importDining)
/payments  -> RemoteLoader(loader: importPayment)
/  and any unknown path -> redirect to /bookings
```

This isn't cosmetic — it's a *confirmed* principle from Carnival UK's internal MFE
Standards Review (see "Alignment with the internal MFE Standards Review" below):
"Route-based Micro Front Ends" is listed among the architectural principles the
Architecture/Engineering/Digital/Publicis Sapient/DTO review already agreed on, alongside
React and runtime Module Federation. Concretely, that means:

- Nav links are real `<NavLink to="/dining">` anchors, not `onClick` handlers flipping
  local state — so browser back/forward, bookmarking, and hard-refresh-to-a-deep-link
  all work using nothing but the browser's own history/URL machinery.
- The Ship Server's catch-all route (`apps/ship-server/server.mjs`) serves the Shell's
  `index.html` for any path that isn't `/mfe/…`, `/config/…`, or `/api/…` — so a hard
  refresh on `http://<ship-ip>/dining` works exactly like client-side navigation to it.
- Clicking a nav link is a client-side (`pushState`) navigation, not a full page
  reload — verified directly against a real browser (see "Verification performed").

### An MFE can own its own sub-routes — several levels deep

The Shell maps each MFE to a wildcard, `/bookings/*`, `/dining/*`, `/payments/*` — not a
plain `/bookings` — and the trailing `/*` is what lets each MFE mount its own nested
`<Routes>` and own URLs underneath its one top-level path, without the Shell ever needing
to know they exist. All three MFEs follow the same three-levels-deep shape (list -> detail
layout with its own sub-nav -> a nested sub-list -> a sub-detail, i.e. a child of a
child):

```
/bookings                            Bookings' index route (the booking list)
/bookings/1204                       Bookings' ":cabinSlug" route (Overview / Itinerary / Guests tabs)
/bookings/1204/itinerary             a sibling tab of the same layout
/bookings/1204/guests                a sibling tab that is ITSELF a layout (GuestsLayout)
/bookings/1204/guests/g1             a child of that layout — level 3

/dining/ocean                        Dining's ":restaurantSlug" route (Menu / Reviews tabs)
/dining/ocean/reviews/r1             same shape — ReviewsLayout -> ReviewDetail, level 3

/payments/inv-001                    Payment's ":invoiceId" route (Summary / Line Items tabs)
/payments/inv-001/items/li-2         same shape — LineItemsLayout -> LineItemDetail, level 3
```

See `apps/bookings-mfe/src/BookingsApp.tsx` (and the equivalent `DiningApp.tsx` /
`PaymentApp.tsx`) for the full nested `<Route>` trees, and e.g. `GuestsLayout.tsx` for
what a route that exists purely to be a parent — no UI of its own beyond an `<Outlet />`
— looks like. Each detail layout resolves its record once (`findBookingBySlug`,
`findRestaurantBySlug`, `findInvoiceById`) and passes it down through nested `<Outlet
context={...}>` / `useOutletContext()`, so a level-3 leaf like `GuestDetail` never
re-fetches or re-parses the URL param its parent already resolved.

This works because `react-router-dom` is a Module Federation `singleton` (see below) in
both the Shell and every MFE: an MFE's nested `<Routes>` resolves against the exact same
router instance the Shell's one `<BrowserRouter>` created, so `<Link>`, `useNavigate`, and
`useParams` inside the MFE behave exactly as they would in a single, non-federated app —
browser back/forward and a hard refresh on `/bookings/1204/guests/g1` both work, for the
same catch-all-serves-`index.html` reason a top-level route like `/dining` does. The
Shell's own route config still only ever says `"/bookings/*"`: adding, removing, or
renaming an MFE's internal screens — at any depth — is a change entirely inside that
MFE's own app, requiring no Shell change or redeploy — the same independent-release story
the manifest already gives each MFE, just carried one (or more) levels deeper.

### Why releases are immutable

`pnpm ship:deploy <release>` refuses to run if `mfe/releases/<release>/` already exists
on the ship. Once a release lands on the ship, it never changes again — which is what
makes rollback trivial and safe: rolling back to `2026.09.01` after activating
`2026.09.10` doesn't restore a backup or rebuild anything, it just points the manifest at
assets that were never touched in the first place.

### Why activation is a separate, atomic step from deployment

`pnpm ship:deploy` copies files. `pnpm ship:activate` is the only thing that changes what
the Shell actually loads, and it does so by:

1. Re-validating the release in place (manifest present, every MFE's `remoteEntry.js`
   present and non-empty, manifest entries pointing at the right release).
2. Writing the new active manifest to `mfe-manifest.json.tmp`.
3. `fs.renameSync`-ing it over `mfe-manifest.json`.

`rename` on the same filesystem is atomic, so any request the Ship Server is serving at
that instant sees either the complete old manifest or the complete new one — never a
half-written file. If validation fails, step 2 and 3 never happen, and the previously
active release keeps running untouched (see `scripts/activate-release.mjs`).

### Why rollback needs no rebuild

`pnpm ship:rollback` reads a small activation history
(`apps/ship-server/state/history.json`) and re-runs the exact same atomic-write logic
against the *previous* release's already-installed, already-immutable files. There is
nothing to compile — the old assets were never deleted.

### Why offline works

Every request the Shell or an MFE makes at runtime is same-origin, to the Ship Server:
the HTML, the JS bundles, the manifest, `remoteEntry.js` files, and the one mock
`/api/session` endpoint. There is no Google Fonts link, no CDN script tag, no
cloud-hosted anything. `pnpm build` produces fully self-contained bundles (React and
ReactDOM are bundled/shared via Module Federation's shared-dependency mechanism, not
loaded from a CDN). See "Offline demonstration" below for how to prove this yourself.

### Why browser cache is *not* the offline strategy

It would be tempting to rely on the browser having cached the Shell/MFE assets from a
previous session. That's fragile: caches get cleared, a different device might be used,
and cache headers are easy to get wrong. Instead, the Ship Server is the actual, durable,
always-available source of the app — it's a real local server on the ship's LAN, not a
hope that yesterday's cache is still warm. (The one deliberate use of caching is the
opposite direction: installed release folders under `mfe/releases/` are marked
`immutable`/long-`max-age`, because they truly never change — see `server.mjs`. The
active manifest is explicitly served with `Cache-Control: no-store` for the same reason,
in reverse: it *does* change, atomically, and every fetch must see the latest version.)

### Why shared dependencies (`react`, `react-dom`)

Every MFE's `rspack.config.mjs` federation plugin lists `shared: { react: { singleton: true },
"react-dom": { singleton: true } }`, as does the Shell's. This means only one copy of React is ever loaded into the page,
regardless of which MFEs are active — avoiding duplicate React instances (which breaks
hooks and context) and reducing payload size. **If the Shell and an MFE ever shipped
genuinely incompatible major versions of React**, Module Federation's shared-scope
negotiation would fall back to loading both versions side-by-side (or fail, depending on
the `singleton`/`strictVersion` settings) — which is exactly the kind of thing release
validation and a staged rollout (activate on ship, watch it, roll back if wrong) exists
to catch before it reaches every passenger.

### Per-app Tailwind prefixes

Every app compiles its own Tailwind CSS independently (`apps/*/src/tailwind-input.css`
→ `tailwind.css`, built via each app's own `build:css` script) and bundles it into its
own federated JS module — there's no single "app-wide" stylesheet. Each app's compiled
utilities are namespaced with a Tailwind v4 `prefix()`: the Shell uses `sh:`, Bookings
`bk:`, Dining `dn:`, Payment `pm:` — so `className="flex items-center"` in the Shell is
`className="sh:flex sh:items-center"`, and the exact same pattern in Bookings is
`"bk:flex bk:items-center"`.

```css
/* apps/bookings-mfe/src/tailwind-input.css */
@import "tailwindcss/theme" layer(theme) prefix(bk);
@import "@mfe/design-system/tailwind-theme.css" layer(theme) prefix(bk);
@import "tailwindcss/utilities" layer(utilities) prefix(bk) source(".");
```

Without this, every app's compiled CSS would define the *same* selector names
(`.flex`, `.gap-2`, `.rounded-ds-pill`, …) from the *same* shared theme — harmless today
because every app currently builds against the same Tailwind/theme version, but not a
guarantee that holds as each MFE is released independently over time (that's the whole
point of this repo — see "Independent MFE deployment" below). A newer or older Tailwind
on one MFE could one day generate a same-named class with different computed CSS, and
whichever bundle's `<style>` happened to load last would silently win on every page that
mounts more than one app — a real, hard-to-diagnose cross-MFE bug class in production
Module Federation setups. Prefixing makes that structurally impossible: `.bk\:flex` and
`.dn\:flex` cannot collide no matter how far their definitions drift.

Two things worth knowing if you touch this:

- **`prefix()` must be on every Tailwind-owned `@import` in a file** (both the `theme`
  and `utilities` imports, and the shared `@mfe/design-system/tailwind-theme.css` import,
  which is where the shared `--*-color-ds-navy` etc. theme variables actually get
  declared) — applying it to only one silently produces an *empty* compiled stylesheet
  with this Tailwind version (4.3.3), not a partially-prefixed one. This was verified
  directly against the CLI; the public docs and community discussions on this point are
  inconsistent, so don't take a stale blog post's word for it if you're debugging this.
- **Source must write the prefixed class name directly** — `className="bk:flex"`, not
  `className="flex"` expecting Tailwind to add the prefix for you.

`@mfe/design-system`'s own `tailwind-input.css` (the one file that ships global Preflight,
imported exactly once by the Shell — see "Why offline works" for why that stays singular)
is deliberately **not** prefixed: it generates zero utility classes of its own
(`source(none)`), so there's nothing for a prefix to namespace, and prefixing it would
work against the very thing every app's prefix exists to protect. The hand-authored CSS
classes everything still shares (`.mfe-panel`, `.nav-tab`, `.ds-button`, …) aren't
Tailwind-generated either, so they're untouched by any of this — same one global
`styles.css`/`@mfe/design-system/styles.css`, same class names, on purpose.

This is also what makes running one MFE standalone (`pnpm --filter @mfe/bookings-mfe
dev`) safe to reason about in isolation: whatever utility classes render are provably
*this app's own*, never a same-named class another app happened to define differently.

### Sharing Shell state with an MFE (a version-pinned Context, not props)

`packages/shared-state` exports a small React Context (`ShellStateProvider` /
`useShellState`) that carries the Shell's session (see `SessionBadge.tsx`) and a trivial
piece of mutable state — a notification counter — down into every MFE, and back up
again:

```
Shell (owns ShellStateProvider, mounted once in App.tsx)
  │  value: { session, notificationCount, lastNotification, notify() }
  ▼
Bookings MFE (BookingsList.tsx) — useShellState()
  - reads session.user directly, no re-fetch of its own
  - calls notify("...") from a "Notify crew" button
  ▼
Shell's own SessionBadge — also useShellState()
  - re-renders with the updated notificationCount instantly, no page reload
```

This is a genuinely different mechanism from the `react`/`react-dom` sharing above, even
though the setup looks the same: `@mfe/shared-state` is listed as a version-pinned
`singleton` (`requiredVersion` + `strictVersion`, exactly like `@mfe/design-system`) in
*both* the Shell's and Bookings' `rspack.config.mjs`. That pinning isn't optional here —
`ShellStateContext` is created once, by `createContext()`, inside that package's source.
If the Shell and Bookings each bundled their *own* independently-built copy of
`@mfe/shared-state` (i.e. it were shared without `singleton: true`, or not shared at
all), each copy's `createContext()` call would produce a distinct context identity, and
`useShellState()` inside the MFE would silently read the context's default value (`null`)
instead of the Shell's actual `Provider` value — a classic Module Federation footgun for
any cross-app Context, not just this one. `useShellState()` returns `null` gracefully
(rather than throwing) specifically so an MFE's own standalone dev mode — which never
mounts `ShellStateProvider` — degrades instead of crashing (see
`apps/bookings-mfe/src/bootstrap.tsx`).

Prop-drilling (the Shell passing values as props to `<Component sessionUser={...} />`)
is the simpler alternative and doesn't need any of this singleton plumbing — it's the
better default for most Shell → MFE data. Context is worth the extra setup specifically
when state also needs to flow MFE → Shell, or Shell → many independently-loaded MFEs at
once, without every intermediate layer having to know about it.

### Why authentication is explicitly out of scope here

**Module Federation being offline does not automatically make authentication offline.**
If this system's real login flow depended on a cloud OIDC provider, the app could still
fail to let anyone in while the ship has no uplink — MFE delivery and session/identity
are separate architectural concerns. This POC only proves the MFE-delivery half. It
includes one deliberately trivial mock: the Ship Server exposes `GET /api/session`
returning a hard-coded user, and the Shell displays it in the header — just enough to
demonstrate that *some* session state can be served locally with no cloud round-trip. A
real implementation would need a ship-local identity provider:

```
Ship Browser -> Ship-local Identity Provider -> Local Session
```

with its own sync/provisioning story (e.g. accounts synced down at the last port), which
is a separate project from this one.

## 4. Project structure

```
offline-mfe-poc/
├── apps/
│   ├── shell/            # Host app: manifest fetch, nav, MFE slots, error/loading states
│   ├── bookings-mfe/     # Remote: exposes ./BookingsApp (owns its own /:cabinSlug sub-route)
│   ├── dining-mfe/       # Remote: exposes ./DiningApp
│   ├── payment-mfe/      # Remote: exposes ./PaymentApp
│   └── ship-server/      # Express server: serves Shell, MFE releases, manifest, mock API
├── packages/
│   ├── shared-types/     # MfeManifest contract + isMfeManifest() runtime validator
│   ├── shared-config/    # MANIFEST_PATH, ports — structural constants, not URLs
│   └── shared-state/     # Cross-app Context: ShellStateProvider / useShellState()
├── releases/             # Shore-side staged release artifacts (build-release output)
├── scripts/               # build / package / validate / deploy / activate / rollback / seed
│   └── lib/               # shared script logic (paths, fs helpers, validation, history)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── vitest.config.ts
└── README.md
```

## 5. Prerequisites

- Node.js 20+ (built and verified on Node 24)
- pnpm 9+
- `tar` on PATH (used by `pnpm ship:package`; present on any Linux/macOS box)

## 6. Everyday development

```bash
pnpm install                       # install all workspace packages

pnpm --filter @mfe/shell dev       # iterate on the Shell alone (Rspack dev server, :5000)
pnpm --filter @mfe/bookings-mfe dev  # iterate on one MFE in isolation (:5001), renders
                                      # standalone via src/bootstrap.tsx — not through federation

pnpm build                         # production build: shell + all 3 MFEs
pnpm test                          # vitest — manifest schema, release validation,
                                      # rollback history, Shell manifest/remote-load logic
pnpm typecheck                     # strict tsc --noEmit for shell + all 3 MFEs
```

Federated Module Federation loading only really "happens" once real, built
`remoteEntry.js` files exist and are served together from one place — which is what the
`ship:*` pipeline below sets up. That pipeline is the actual way to see the whole system
running together.

## 7. Release management commands

```bash
pnpm ship:build <release>      # builds Shell + all 3 MFEs, stages releases/<release>/
pnpm ship:package <release>    # tars releases/<release>/ -> ship-release-<release>.tar.gz
                                #   + a .sha256 checksum file next to it
pnpm ship:deploy <release>     # validates the staged release, then installs it
                                #   immutably under the Ship Server (refuses to
                                #   overwrite an already-installed release)
pnpm ship:activate <release>   # re-validates the installed release, then atomically
                                #   swaps the active manifest (rejects & leaves the
                                #   current release running if validation fails)
pnpm ship:rollback             # atomically re-activates the previous release from
                                #   history — no rebuild
pnpm ship:validate [release]   # prints the validation checklist for a release
                                #   (defaults to whichever release is currently active)
pnpm ship:status               # prints active release, its MFE versions, installed
                                #   releases, and the activation history
pnpm ship:server                # starts the Ship Server on http://localhost:4173
pnpm ship:break <release> [mfe]  # demo tool: simulates a corrupted installed release
                                   # by removing one MFE's remoteEntry.js, so you can
                                   # watch ship:activate refuse it
```

`pnpm seed` runs the whole shore-side pipeline twice to produce the two demo releases
described below (it's what was used to produce the state this repo ships with).

## 8. Demo: two real releases, a rollout, and a rollback

This repo already ships with two fully built, installed releases (produced by
`node scripts/seed-releases.mjs`), so you can run the exact walkthrough below without
building anything first:

- **`2026.09.01`** — Bookings shows only `Cabin 1204 / Check-in 20 Sep / Check-out 27
  Sep`. This is the **active** release.
- **`2026.09.10`** — Bookings additionally shows **"Dinner reservation confirmed"**
  (Bookings bumped to `v1.1.0`; Dining and Payment are byte-for-byte unchanged from
  `2026.09.01` — proving one MFE can evolve independently of the others and of the
  Shell). This release is **installed but not yet active**.

Walkthrough:

```bash
pnpm ship:server
# open http://localhost:4173 in a browser (redirects to /bookings)
```

1. `/bookings` shows `Cabin 1204` only, no dinner line. The release bar reads
   `Current Release: 2026.09.01` / `Bookings: 1.0.0 · Dining: 1.0.0 · Payment: 1.0.0`.
   Click **Dining** / **Payments** in the nav, or go directly to
   `http://localhost:4173/dining` — each is a real, deep-linkable, bookmarkable URL.
2. In another terminal: `pnpm ship:activate 2026.09.10`.
3. Refresh the browser at `/bookings` (no rebuild, no restart of anything). Bookings now
   additionally shows **"Dinner reservation confirmed"**; the release bar reads
   `2026.09.10` / `Bookings: 1.1.0`. `/dining` and `/payments` are pixel-identical to before.
4. `pnpm ship:rollback`.
5. Refresh the browser. Bookings is back to showing only `Cabin 1204` — release
   `2026.09.01` is active again, with **zero rebuild**.

### Demo: a bad release gets rejected, not activated

```bash
pnpm ship:break 2026.09.10 dining   # simulates corruption: removes dining's remoteEntry.js
pnpm ship:activate 2026.09.10       # validation fails -> "Release was NOT activated."
```

The checklist printed shows `✗ dining remoteEntry.js`, and the currently active release
(whatever it was) keeps running untouched — the manifest was never rewritten. To repair
the demo release afterwards: rebuild and redeploy it fresh, e.g.
`rm -rf releases/2026.09.20 apps/ship-server/public/mfe/releases/2026.09.20 && pnpm ship:build 2026.09.20 && pnpm ship:deploy 2026.09.20`,
or simply re-run `node scripts/seed-releases.mjs` from a clean `releases/` +
`apps/ship-server/public/mfe/releases/` state.

### Demo: independent MFE deployment, at the source level

`git diff`-equivalent proof that only Bookings changed between the two releases: compare
`apps/bookings-mfe/package.json` (`1.0.0` → `1.1.0`) and `apps/bookings-mfe/src/BookingsApp.tsx`
against `apps/dining-mfe` / `apps/payment-mfe`, which never changed version or source
between the two release builds.

## 9. Offline demonstration

The Ship Server is the *only* thing the Shell or any MFE ever talks to. To prove that:

1. `pnpm ship:server`, open `http://localhost:4173`, confirm all three routes
   (`/bookings`, `/dining`, `/payments`) load.
2. Disconnect the machine from the internet (turn off Wi-Fi, unplug ethernet, or use your
   OS's airplane mode) — leave the Ship Server itself running, since *it* is the ship's
   local network, not the internet.
3. Refresh the browser. Everything still loads: Shell, all three MFEs, the release
   banner, the mock session badge.

If you want to prove it at the network level instead of trusting your OS's airplane
mode, block everything except localhost with a firewall rule for the duration of the
test, e.g. on Linux: `sudo iptables -I OUTPUT -o lo -j ACCEPT && sudo iptables -I OUTPUT
-j REJECT` (undo afterwards with `sudo iptables -D OUTPUT -j REJECT`). This repository's
own verification (see bottom) confirms there is nothing to catch: a full-text search of
every built bundle turns up zero external `http(s)://` references other than XML
namespace URI *strings* baked into React's own DOM/SVG handling code (never fetched) and
a React error-decoder documentation link embedded in error messages (also never
fetched).

## 10. Testing

```bash
pnpm test
```

18 tests across 4 files, all pure logic (no browser/DOM required, so they run fast and
everywhere):

- `packages/shared-types/src/manifest.test.ts` — `isMfeManifest()` accepts a well-formed
  manifest and rejects one missing an MFE, with a wrong-typed field, or missing `release`.
- `scripts/lib/manifest.test.mjs` — `validateReleaseDir()` against real temp-directory
  fixtures: passes a complete release, fails one missing an MFE's `remoteEntry.js`, fails
  one with no `manifest.json`, fails one whose manifest references the wrong release.
  Also covers the rollback history stack (`recordActivation`): appending truncates redo
  history, the previous release stays reachable, re-activating the current release is a
  no-op.
- `apps/shell/src/manifest/fetchManifest.test.ts` — the Shell's manifest-loading logic
  (extracted from its React hook so it's testable without a DOM): accepts a valid
  manifest, reports the Ship Server's HTTP status on failure, rejects a manifest that
  fails schema validation, and handles the network being unreachable entirely.
- `apps/shell/src/federation/loadRemoteComponent.test.ts` — the Shell's per-MFE load
  logic: resolves to the exposed component on success, and turns a rejected remote import
  into a typed error result instead of throwing (this is what backs the "Unable to load
  X" UI).

## 11. Deliberate simplifications (a POC, not a production system)

- **Retry after a load failure**: the Shell's "Retry" button re-invokes the same
  `import("bookings/BookingsApp")` call, which re-runs the `dynamicRemote` script-injection
  code in `rspack.config.mjs` if the container hasn't successfully registered yet (a failed
  script load never sets `window.bookings`, so the guard at the top of that code correctly
  falls through to a fresh `<script>` tag / fresh network request, verified directly — see
  "Verification performed"). If a remote's shared module state was left in a broken
  condition by a very unusual failure mode, a full page reload is the reliable fallback —
  worth knowing for a real deployment, not something this POC works around.
- **Checksums are integrity-only, not authenticity**: `pnpm ship:package` produces a
  plain SHA-256, which catches accidental corruption during transfer but does not prove
  who built the release. A production version of this should sign releases (e.g.
  minisign/cosign) and have `ship:deploy`/`ship:activate` verify the signature, not just
  the hash — the checksum step here is structured so that slots in without redesigning
  anything else.
- **The Shell is deployed independently of MFE releases** (overwritten in place by
  `ship:deploy`, not versioned per-release) — this is intentional (Constraint 10), not a
  gap, but it does mean a Shell-breaking change needs its own release/rollback story,
  which this POC doesn't model.
- **No real identity/session system** — see "Authentication" above.
- **Single ship-server process, no HA** — a real ship would run this behind a supervisor
  that restarts it if it crashes; out of scope here.

## 12. Alignment with the internal MFE Standards Review

Carnival UK's Architecture/Engineering/Digital/Publicis Sapient/DTO teams ran an MFE
Standards Review (May–Aug 2026) that reached agreement on some principles and left seven
areas explicitly open pending a funded POC. This project *is* that POC for the shipboard
half of the question, so here is exactly how it resolves each one — distinguishing what
the doc already confirmed, what this codebase decides, and what remains a genuine
organizational/process decision this repo can't settle by itself.

**Already confirmed by the review** (this POC follows these directly): route-based MFEs,
React, runtime Module Federation, a lightweight shell, independent application
ownership, and CI/CD quality gates. All six show up directly in this repo — see the
routing section above, the three independently-versioned MFE apps, the Shell's total
absence of business logic, and the `ship:validate` gate that runs before every install
and every activation.

**The seven open areas:**

1. **Shell architecture scope** — resolved narrowly, in code: `apps/shell` only ever
   does routing, manifest fetch, nav, loading/error UI, and the mocked session badge. It
   has zero booking/dining/payment logic — that all lives in the MFEs, where it's
   independently owned. The broader ask ("clearly defined shell ownership/governance")
   is an org decision, not a code one — see #7.
2. **Third-party MFE integration** — this POC only has internal MFEs, but the pipeline
   doesn't special-case that: whatever produces a `remoteEntry.js` and a version, internal
   or vendor, goes through the exact same `ship:build → ship:deploy → ship:activate` gate
   before it can reach a ship. The policy this implies for vendor MFEs (Flight Seat
   Booker, xManager, etc.): **a vendor's remote gets vetted and pinned into the ashore
   release composition exactly like an internal one — never a live fetch from the
   vendor's own infrastructure at sea.** Single-spa's 3-function lifecycle is worth
   evaluating for vendor integration specifically (it doesn't assume shared build
   tooling) if a vendor can't produce a Module Federation container; this repo doesn't
   need to answer that yet because it has no vendor MFE to integrate.
3. **Module Federation viability** — kept, deliberately in its *pinned* mode rather than
   the "any remote from any origin, resolved live against a service registry" mode the
   review's concerns (version management, service-discovery dependency, operational
   complexity) were really aimed at. See #4 — once remote resolution is pinned at
   package time, MF's real benefits (singleton dependency dedup, independent builds,
   code splitting) come with almost none of the live-resolution risk.
4. **Resilience & shipboard operation** — this is the constraint everything else in this
   repo is built around, and it's why "runtime manifest" here does not mean "live service
   discovery": `pnpm ship:build` generates `manifest.json` once, ashore, alongside every
   `remoteEntry.js` it references, and `pnpm ship:deploy` installs all of it — Shell,
   manifest, every remote — as one unit under the ship's single Ship Server. The Shell's
   `import("bookings/BookingsApp")` still resolves its URL "at runtime" in the narrow
   sense that the JS expression evaluates on import, but what it resolves *against* is a
   local, already-installed, versioned snapshot — never a live call to some other
   service's origin. This collapses "are N independently-deployed services all
   simultaneously reachable" down to "is the ship's own server up," which is the
   resilience posture the review asked for.
5. **Independent deployability** — treated as an ashore-only benefit, not a shipboard
   one, per the review's own framing. Each MFE has its own `package.json` version and
   builds independently (`pnpm --filter @mfe/bookings-mfe build`), which is where the
   real payoff (small PRs, no cross-team coordination, fast iteration) is realized. But
   nothing can reach a ship without going through the mandatory "compose and pin" gate —
   `ship:build` (compose) → `ship:deploy` (install, still inactive) → `ship:activate`
   (the actual promotion step, gated by `ship:validate`). That's the
   dev→SIT→prod-style environment promotion the review needs, with "prod" being "this
   ship's next port-call package," not a live rolling deploy.
6. **Monorepo vs. multi-repo** — this repo is a monorepo (one pnpm workspace: Shell + all
   3 MFEs + shared packages), which is what makes `ship:build`/`ship:status` able to
   answer "what exact set of MFE versions makes up the active release" from one place.
   The review left this genuinely open for the org's real repo strategy; this codebase
   can't settle "should Bookings/Dining/Payment live in separate company repos long-term,"
   only demonstrate that *whatever* the repo split, there must be one composition point
   that can answer that question — which is what `ship:status` and the manifest are.
7. **Governance & ownership** — the review correctly identified this as a gap technical
   standards alone can't close, and it stays a gap here too: no script in this repo can
   enforce "the platform/shell team has veto authority over what ships to a vessel" — that's
   an org policy. What this repo *can* and does provide is the mechanism such a policy
   would run through: a single `ship:activate` gate that is the only path to production
   for every MFE release, internal or vendor, which is exactly the kind of choke point a
   governance model needs to attach to (e.g., "only the platform team's CI identity may
   run `ship:activate` against a ship's manifest").

## 13. Verification performed

Everything below was actually run against this repository, not just written. This log
reflects the Rspack build specifically (re-run in full after migrating off Vite):

- `pnpm install` — clean install across all 8 workspace packages with Rspack.
- `pnpm test` — 18/18 tests passing (unaffected by the bundler migration — they test
  pure logic, not build output; Vitest's own internal use of Vite to run tests is
  unrelated to which bundler the *apps* use).
- `pnpm typecheck` — strict `tsc --noEmit` passes for the Shell and all 3 MFEs.
- `pnpm build` — Shell + all 3 MFEs build successfully with `rspack build`, each in
  under 200ms. Confirmed `remoteEntry.js` lands at the root of each MFE's `dist/`
  (no `assetsDir` workaround needed, unlike the old Vite plugin).
- Reverted Bookings to its pre-"Dinner reservation confirmed" baseline, wiped all
  installed releases and activation history, then ran `node scripts/seed-releases.mjs`
  end-to-end against the Rspack builds — built, deployed, and activated release
  `2026.09.01`, then evolved Bookings and built/deployed (but did not activate) release
  `2026.09.10`.
- Drove a real headless Chrome instance over the DevTools Protocol (WebSocket, via
  Node's native `WebSocket`) against the running Ship Server:
  - Confirmed CSS is actually applied post-migration by reading
    `getComputedStyle(document.querySelector('.shell-header')).backgroundColor` —
    Rspack's async CSS chunk (loaded alongside the route's JS chunk, injected via a
    generated `<link>` tag at runtime) resolved to the correct color.
  - Clicked the "Dining" nav link and confirmed the URL changed to `/dining` and
    Dining's content rendered, while `performance.getEntriesByType('navigation').length`
    stayed at `1` — proving it was a client-side route change, not a full page reload.
    Then verified `history.back()` and `history.forward()` both work correctly.
  - `ship:activate 2026.09.10` + reload (no rebuild): Bookings showed "Dinner
    reservation confirmed", release bar showed `2026.09.10` / `1.1.0`.
  - `ship:rollback` + reload: back to `2026.09.01`, no dinner line.
  - Deleting the active release's `bookings/remoteEntry.js` and reloading rendered
    exactly `Unable to load Bookings. / The Bookings service is currently unavailable. /
    Retry`, and restoring the file recovered cleanly — **but only once `Network.setCacheDisabled`
    was set via CDP**: the Ship Server correctly marks installed releases `immutable`, so
    a browser that already fetched `remoteEntry.js` once will keep serving it from its own
    disk cache and never re-request a deleted/changed file at that exact URL. That's
    correct production behavior for immutable release assets — it just means this specific
    "simulate corruption" test technique needs cache disabled to be trustworthy, since a
    real corrupted release wouldn't already be sitting in a browser's cache from an
    earlier, working version at the same URL.
  - Deleting `config/mfe-manifest.json` (Ship Server otherwise still up) rendered
    `Unable to reach the Ship Server. / Manifest request failed with HTTP 404 / Retry`
    (the manifest route is explicitly `Cache-Control: no-store`, so no cache workaround
    was needed here).
- `ship:break 2026.09.10 dining` followed by `ship:activate 2026.09.10` printed a
  checklist with `✗ dining remoteEntry.js`, exited non-zero, and left the previously
  active release's manifest completely untouched.
- `ship:package 2026.09.01` produced a `.tar.gz` and `.sha256`, verified with
  `sha256sum -c`.
- A recursive search of every built JS bundle for `http(s)://` found only inert strings
  (XML namespace URIs inside React's own code, a documentation link inside a React error
  message) — no runtime fetch to anything outside the Ship Server.

---

## Summary

```
Architecture
------------
Shell:              apps/shell — Rspack + React + TS, Module Federation HOST. Fetches
                     /config/mfe-manifest.json at startup, then routes /bookings,
                     /dining, /payments (react-router-dom, BrowserRouter) to the
                     matching MFE, each dynamically imported ("bookings/BookingsApp"
                     etc.) with its remote URL resolved, at import time, from that
                     fetched manifest — never hard-coded. Route-based MFEs is an agreed
                     principle from Carnival UK's MFE Standards Review (see section 12).
Ship Server:         apps/ship-server — Express. Serves the Shell, every installed
                     immutable release, the active manifest (no-store), and one mock
                     /api/session endpoint. The only thing anything talks to at runtime.
MFEs:                apps/bookings-mfe, apps/dining-mfe, apps/payment-mfe — independent
                     Rspack + React + TS apps, each a Module Federation REMOTE exposing
                     one component, each with its own package.json version.
Manifest:            apps/ship-server/public/config/mfe-manifest.json — { release,
                     activatedAt, mfes: { bookings/dining/payment: { version, url } } }.
                     Validated with packages/shared-types#isMfeManifest at runtime.
Release mechanism:   scripts/build-release.mjs stages releases/<release>/ (immutable,
                     shore-side). scripts/deploy-ship.mjs validates + installs it under
                     the Ship Server, refusing to overwrite an existing release.
Rollback mechanism:  apps/ship-server/state/history.json is a simple back/forward stack
                     of activated releases; scripts/rollback-release.mjs atomically
                     re-points the active manifest at the previous entry's already-
                     installed, untouched files. No rebuild, ever.

Commands
--------
pnpm install / pnpm build / pnpm test / pnpm typecheck
pnpm ship:build <release> / ship:package <release> / ship:deploy <release>
pnpm ship:activate <release> / ship:rollback / ship:validate [release]
pnpm ship:status / pnpm ship:server / pnpm ship:break <release> [mfe]
node scripts/seed-releases.mjs   (produces the two demo releases from scratch)

Demo
----
pnpm ship:server, open http://localhost:4173 -> redirects to /bookings, shows
"Cabin 1204" only (release 2026.09.01, active). pnpm ship:activate 2026.09.10, refresh
-> Bookings adds "Dinner reservation confirmed" (release 2026.09.10, no rebuild).
pnpm ship:rollback, refresh -> back to "Cabin 1204" only. /dining and /payments are
real, deep-linkable, bookmarkable URLs; browser back/forward work natively. All verified
against the built, served app in a real (headless) Chrome session, including a
DevTools-Protocol-driven click + back/forward test proving client-side navigation
(no full page reload) — not just described.

Known limitations
------------------
Retry re-runs the same dynamic import (works for real network blips, not a substitute
for a page reload after very unusual failures). Checksums prove integrity, not
authenticity — no release signing. Shell is deployed/overwritten independently of MFE
releases by design, with no versioned rollback story of its own. Authentication is an
explicitly separate, unsolved concern here (one mocked local session endpoint only).
Single ship-server process with no process supervisor/HA story. Governance (who may
run ship:activate against a real ship) is a process decision this repo enables but
cannot enforce by itself — see section 12, item 7.
```
