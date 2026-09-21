# Micro-Frontend vs. Monolith: Trade-offs

This document compares the trade-offs of this project's architecture (Module
Federation-based micro-frontends, composed at runtime via a manifest) against a
"normal" monolith, where the Shell and all MFEs are built and deployed as a single
unit.

## Micro-frontend (Module Federation, runtime composition) — this project's approach

### Pros

- **Independent deploy/rollback without rebuilding everything** — this is the entire
  reason this repo exists. `ship:activate 2026.09.10` / `ship:rollback` swap what's
  live by rewriting one JSON file, no Shell rebuild, no MFE rebuild. In a monolith,
  "roll back" means redeploying an older full build.
- **Independent ownership/versioning** — Bookings can go to `1.1.0` while Dining and
  Payment stay byte-for-byte unchanged (proven in the two demo releases). Different
  teams can ship on different cadences without coordinating a joint release train.
- **Blast radius containment** — a broken Payment release fails to load with a scoped
  "Unable to load Payment" error; Bookings and Dining keep working. In a monolith, a
  bug anywhere can break (or block deploying) the whole app.
- **Smaller, faster individual builds** — each MFE builds in isolation (~200ms in this
  repo); a monolith's build time grows with total app size.
- **Physical/offline distribution unit maps naturally to "one thing changed, ship just
  that thing"** — critical for the actual constraint here (no internet at sea, transfer
  via drive/LAN sync at port).

### Cons

- **Real operational complexity for what it buys you** — this requires maintaining
  `manifest.json`, a validation gate, atomic activation, rollback history, immutable
  release folders, and a `dynamicRemote()` script-injection shim in the Rspack config.
  A monolith needs none of that machinery.
- **Runtime coupling risk via shared singletons** — React/ReactDOM are
  `singleton: true` across the Shell and all 3 MFEs. If one MFE ever needs an
  incompatible major version, you get side-by-side duplicate React instances (breaks
  hooks/context) or a hard failure — a class of bug that literally cannot happen in a
  single build with one `package.json`.
- **More moving parts to debug** — a failure can be: manifest missing, remote's
  `remoteEntry.js` 404/corrupt, version mismatch in shared deps, script-injection race,
  or the MFE's own code. A monolith's failure surface is just "the app's own code."
- **Weaker compile-time safety across boundaries** — the Shell doesn't import
  Bookings' source, so TypeScript can't catch a Bookings API change breaking the Shell
  at build time the way it would inside one project; it relies on runtime contracts
  (exposed component signatures) staying compatible.
- **Extra indirection for anyone new to the codebase** — "where does
  `import("bookings/BookingsApp")` actually resolve to" requires understanding the
  manifest + dynamic remote mechanism, not just following an import statement.
- **Duplication across MFEs** — each app has its own `package.json`,
  `rspack.config.mjs`, `tsconfig.json`, and build tooling config — more repetition to
  keep in sync than one shared config in a monolith.

## Normal monolith (one app, built and deployed as a single unit)

### Pros

- **Simplicity** — one build, one deploy, one versioned artifact. No manifest, no
  runtime remote resolution, no shared-dependency negotiation to get wrong.
- **Full compile-time safety** — the compiler sees the whole app; a breaking change
  anywhere fails the build immediately, not at runtime in a user's browser.
- **Easier debugging** — one bundle, one source of truth, no "which release/version
  combination is actually live right now" question.
- **No coordination tax for shared dependencies** — one `package.json`, one React
  version, period.
- **Simplest possible offline story if updates are infrequent** — a single tarball,
  single deploy step; you'd lose the granular "roll back just the bookings feature"
  ability but might not need it.

### Cons

- **All-or-nothing releases** — can't ship Bookings independently of Dining/Payment;
  every release recompiles/redeploys the entire app even if only one feature changed.
- **All-or-nothing rollback** — reverting a bad Bookings change means redeploying an
  entire previous build of everything, not flipping one pointer.
- **Coordination overhead grows with team count** — multiple teams touching one
  codebase/build means merge conflicts, shared release calendars, and one team's bug
  blocking everyone else's ship date.
- **No blast-radius isolation** — a crash or infinite loop in one feature can take down
  the whole app (more about code isolation than build strategy per se, but a common
  consequence of a single build unit).
- **Build time scales with total app size** — as the app grows, the single build gets
  slower for everyone, even people only touching one small part.

## State management

State management deserves its own callout because it behaves very differently under
the two architectures, and it's an area where the trade-off isn't obviously in either
direction.

### Micro-frontend

**Pros**

- **Forces clean state boundaries** — each MFE owns its own local state and can't
  casually reach into another team's store. This removes an entire class of spaghetti
  coupling that shared global stores are prone to in a monolith.
- **Team autonomy over state tooling** — one MFE can use plain `useState`, another
  could use Zustand or React Query, without an app-wide decision forcing everyone onto
  the same library.
- **No shared-state contract to break on rollback** — since state isn't shared across
  remotes here, rolling Bookings back to `1.0.0` can't corrupt Dining's or Payment's
  state, because there's nothing shared to corrupt.

**Cons**

- **No single source of truth for cross-cutting state** — anything that logically spans
  MFEs (a session/user object, a cart total that touches both Bookings and Payment, a
  feature flag) either gets duplicated (each MFE fetches/holds its own copy) or has to
  be lifted into the Shell and threaded through as props/context — which then becomes a
  cross-remote contract that independently-versioned MFEs must all agree on.
- **Cross-MFE communication needs its own mechanism** — components in different
  remotes can't just import each other's context/hooks the way modules in one project
  can. Sharing state at runtime typically means a shared-scope singleton context,
  custom events, URL params, or browser storage — each with its own edge cases (e.g., a
  shared React Context still requires the exact same Context identity across remotes,
  which is fragile the moment remotes are built independently).
- **State-shape versioning becomes a real risk once state is shared** — if a session
  object's shape ever changes, an old Shell talking to a newly-activated MFE (or vice
  versa, given independent activation/rollback) could disagree on that shape with no
  compiler to catch it — this repo's `ship:validate` checks manifest/`remoteEntry.js`
  integrity today, not state-contract compatibility.
- **No unified devtools timeline** — debugging "what changed and why" across MFEs means
  stitching together separate local states instead of one Redux/Zustand devtools view.

**Current state of this repo:** there is *no* shared state at all right now — every
piece of state (`SessionBadge`, `useShipManifest`, `RemoteLoader`, `BookingsApp`'s
`viewing`) is local `useState` scoped to its own component. That's not an oversight;
it's the easy case for MFEs, and it's exactly why none of the cross-MFE state cons
above have bitten yet. The moment a real cross-cutting concern shows up (e.g., "show
the same cart total in Bookings and Payment"), this project would have to make one of
the trade-offs above explicitly.

### Monolith

**Pros**

- **A single global store is trivial and safe** — one Redux/Zustand/Context setup at
  the app root, one source of truth, one devtools timeline, and the compiler checks
  every consumer against the same types.
- **Cross-feature state sharing is just an import** — no cross-remote contract, no
  runtime negotiation, no versioning skew between producer and consumer of a piece of
  state.
- **Refactors are safe** — renaming a field in the shared store is a single, type-checked
  change; the compiler finds every call site in one build.

**Cons**

- **Shared state becomes a coordination bottleneck** — the store is a shared resource
  every team touches, so it reintroduces the same "all-or-nothing coordination"
  cost that a monolith already has at the build/deploy level, just at the state layer.
- **Tempts tight coupling** — because reaching into any part of the store is easy,
  it's also easy for features to become implicitly dependent on each other's state
  shape without a boundary forcing anyone to notice.

## Which fits this project

The MFE/Module-Federation approach isn't chosen here for its own sake — it's a direct
answer to a hard constraint this project's README states explicitly: the ship can't
get a rebuild-and-redeploy cycle whenever it wants, and a bad release must be
revertible instantly with zero recompilation. That constraint is exactly what a
monolith is worst at (all-or-nothing build/deploy/rollback) and exactly what runtime
Module Federation plus an atomic manifest is built for.

If this were an ordinary, always-connected web app with no offline/instant-rollback
requirement, a monolith would genuinely be the simpler, lower-risk default — the MFE
machinery here is buying something specific (independent shipboard rollback with no
rebuild), not generic "microservices are better" dogma.
