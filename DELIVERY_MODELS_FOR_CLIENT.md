# How the Ship Frontend Is Built and Delivered from Front-end side.

### Three ways to organise the code, and what happens when something goes wrong

How a change travels from a developer's desk to a screen on a vessel, the three ways we can
organise the code and teams to make that happen, and what can go wrong in each — including the
two questions raised: _what if a team publishes a build and the version is never updated?_ and
_what if one team's build is not compatible with another's?_

> **All three arrangements deliver the same thing to the vessel: one approved frontend image
> per release.** Only the way teams work ashore differs. Nothing here changes what Operations
> installs or how a vessel behaves.

---

## 1. What we are delivering

An **application shell** holding five **business modules**, each ownable by a different team.

| Business module | Approx. screens | Owns |
|---|---|---|
| **Accommodation** | 188 | Cabins and rooms. Large enough to be organised into feature areas inside the one module. |
| **Account** | 31 | Guest and staff accounts. |
| **Commerce / Flights** | 31 | Purchases and flight workflows. |
| **Gangway** | 31 | Boarding and disembarkation. |
| **Gifts** | 31 | Gift ordering and fulfilment. |

The **shell** is not a sixth module. It owns authentication, session and permissions; the menu
and routes; ship and voyage context; and the shared API client. Each module owns its own
screens, workflows and API paths (e.g. `/accommodation/v1/rooms`). Domain data and unsaved
forms stay inside their module.

Shell and modules meet at a **platform contract** — context, navigation, permissions,
telemetry. A module depends on that published contract, never on the shell's internals.

**On the vessel:** staff browser → local HTTPS ingress → Nginx pods, each carrying the complete
UI package. "Remote" only means a separate build loaded through a URL inside the ship's own
network — never from the internet. Staff see the modules their permissions allow, click
Accommodation, and it loads; no manual step.

**Each release is one Docker image** (Nginx plus all static files for the shell and all five
modules), approved ashore, placed in the ship-local registry and activated by Operations during
an approved window.

---

## 2. The journey every change makes

```
  1. BUILD           2. COLLECT          3. CHECK           4. PACK            5. ACTIVATE
 ────────────      ──────────────     ──────────────     ─────────────      ──────────────
 A team builds     Finished module    Automatic          Exact versions     Operations
 and tests its     builds, shell      checks: do these   recorded in the    promotes the
 module, then      and shared         versions agree     release catalog;   tested image in
 publishes a       libraries are      with each other?   one Docker image   an approved
 numbered          gathered in one                       is packed.         window, with
 version.          place.                                                   validation.
```

**Only stage 2 differs between the three arrangements** — that is the whole discussion.

Two deliberate properties, which most of the answers below depend on:

**Publishing does not deploy anything.** A new module version, or a new shared library version,
changes nothing until someone writes it into the release catalog. Work becomes *eligible* to
sail; it does not sail by itself.

**Every release is one combined hosting deployment.** Even with one module changed, the hosting
is redeployed — a rolling pod replacement in an approved window, not an outage.

| Artifact | Current ship release | Next ship release |
|---|---|---|
| Accommodation | 4.2 | **4.3** |
| Gangway | 3.0 | 3.0 |
| Shell + other modules | approved versions | same versions |
| Frontend Docker image | Release A | **Release B** |

---

## 3. Option A — One shared workspace

Shell, shared libraries and all five modules in one place; every team works there.

```
  ┌──────────────────────────────────────────────────────────────┐
  │ Shell  Shared libraries  Accommodation  Account              │
  │                          Commerce/Flights  Gangway  Gifts    │
  └──────────────────────────────────────────────────────────────┘
                 built together ──▶ Docker image ──▶ vessel
```

**Day to day:** make the change and see its real effect immediately. No publishing step, no
versions to update.

**Strength:** two modules *cannot* quietly disagree. A change that breaks another module fails
on a developer's machine, before any release exists. Whole categories of problems below cannot
occur.

**Weakness:** one shared build — a broken change can block every team, and that risk grows with
team count. Everyone is always on the newest version of everything, ready or not.

---

## 4. Option B — One workspace per module

Each team works separately; modules meet only at release assembly.

```
  Accommodation   Account   Commerce/Flights   Gangway   Gifts
        └──── each publishes a numbered build ─────┘
                            ▼
              PRIVATE PACKAGE REGISTRY  (published versions never change)
                            ▼
   ┌──────────────────────────────────────────────────────┐
   │ RELEASE ASSEMBLY    (shell + shared libraries here)  │
   │ Release catalog — exactly what goes out:             │
   │   Accommodation 4.3 · Account 2.1 · Commerce 1.8     │
   │   Gangway 3.0 · Gifts 1.4 · Shell 5.2                │
   └──────────────────────────────────────────────────────┘
                            ▼
                  Docker image ──▶ vessel
```

Two things carry this arrangement:

- **The private registry** — finished builds published under a version number, never modified
  afterwards, so an approved version stays available as long as it is needed.
- **The release catalog** — one reviewed record of exactly which versions go into the next
  image. **The single place that answers "what is going to the vessel?"** Editing it is the
  moment work becomes eligible to sail.

**Day to day:** a team works only in its own space, on its own schedule, running the shell
locally with its own module and the approved versions of the others.

**Strength:** full independence, unambiguous ownership, and an outside supplier can own a module
without access to anyone else's code.

**Weakness:** modules meet late, so disagreements surface at assembly — which is why the checks
in section 6 must be automatic, not something a person is expected to notice.

---

## 5. Option C — A mix

Some modules stay with the shell; others get their own workspace. The split follows teams, not
technology.

```
  SHARED WORKSPACE                        SEPARATE WORKSPACES
  ┌────────────────────────────┐        ┌───────────────┐ ┌─────────┐
  │ Shell  Shared libraries    │        │ Accommodation │ │ Gangway │
  │ Account  Gifts  Commerce   │        └──────┬────────┘ └────┬────┘
  └─────────────┬──────────────┘               └── registry ───┘
                └──────────────▶ RELEASE ASSEMBLY ◀────────────┘
                     builds some, takes others from the registry
                                    ▼
                         Docker image ──▶ vessel
```

**Release assembly does not care where a module came from** — one built in place and one taken
from the registry arrive in the same shape. So a module can move between the two groups later
by changing where its team publishes and one line in the catalog.

---

## 6. The safeguards

| # | Safeguard | What it does |
|---|---|---|
| 1 | **Module tests and build** | A module cannot be published until its own automated tests pass. |
| 2 | **Release catalog review** | Changing a version in the catalog is an approved decision by a named person, not an automatic consequence of someone finishing work. |
| 3 | **Drift check** | Compares the catalog against what has been published. If something newer exists, assembly stops and asks rather than quietly carrying on. |
| 4 | **Compatibility check** | Every module records the shared library, contract and runtime versions it was built against. Anything outside the approved set means **no image is produced at all**. |
| 5 | **Contract compatibility tests** | The platform contract is versioned and tested against the modules using it before it is published. |
| 6 | **Pre-approval validation** | The exact image is deployed to staging and exercised before approval. |
| 7 | **Staged activation** | Operations promotes in an approved window, with validation and a controlled rollout. |
| 8 | **Return to previous release** | The previous image stays in the ship-local registry — going back needs no rebuild and no connection to shore. |

Safeguards 3 and 4 exist specifically because modules are built separately. They are the
difference between *hoping people remember* and *the system not permitting it*.

---

## 7. What if…

### 7.1 A team publishes, and the version is never updated

The image goes out with that module's **previous approved version**. The application works
exactly as before; the new feature is simply absent. An omission produces a **stale** release,
never a broken one — because publishing never upgrades anything by itself.

The same holds for shared libraries. If the UI team publishes `@ship/ui 2.5`:

| Module | Before | After |
|---|---|---|
| Accommodation | UI 2.4 | UI 2.5 — after that team tests it |
| Account | UI 2.4 | UI 2.4, unchanged |
| Gangway | UI 2.3 | UI 2.3, unchanged |

**Applies to B and C.** In A there is no catalog to forget.

**What prevents it:** an automatic request to update the catalog when a team publishes; the
drift check (3) halting assembly when something newer exists; the catalog travelling with the
image so what is installed can be confirmed; team sign-off on their own catalog line; and a
policy on how far behind a module may fall, enforced by the compatibility check.

**If it still happens:** correct the catalog, build and approve a new image. Nothing on the
vessel is damaged. The cost is a delay, not an incident.

*A's opposite risk, stated honestly:* everything in the shared workspace goes out together, so
unfinished work can be swept into a release unless it is switched off.

### 7.2 A team's build is not compatible with the others

Modules are independent but share a few things, each with a deliberate rule:

| Shared item | Rule |
|---|---|
| UI components and utilities | Versioned packages, adopted when each team is ready |
| Runtime and shared runtime context | A small approved compatibility set every module must sit inside |
| Platform contract | A versioned interface with compatibility tests |
| Authoritative business rules | Not shared in the frontend — enforced by the backend through APIs |

**The compatibility check (4) is the main defence, and it runs before any image exists.** At
assembly, what every module was built against is compared with the approved set; any
disagreement stops the build, so a mismatched set never becomes an image. It cannot be skipped
by oversight or agreement.

Behind it: the contract is versioned and tested, so the shell can support the previous version
while teams move across — a module is never broken just because the shell moved on. Then staging
validation (6) catches anything that only appears when modules run together.

On the vessel, the effect is contained: shell navigation stays available, the affected module
shows "unable to load this screen — retry or return to the menu", and other modules keep
working.

**Applies to B and C** — both need safeguard 4. A is largely immune by construction.

### 7.3 The honest limit: separate builds are not complete isolation

| Failure | Realistic scope |
|---|---|
| Module build or load failure | That module only — release gates and a fallback |
| Rendering error | That module only — contained by its error boundary |
| Global styling or shared state defect | May affect other modules |
| Code looping endlessly in the browser | May freeze the shared page |
| Shell, authentication or hosting unavailable | Affects the whole application |

This is why the shell, shared libraries and contract are owned by one platform team and changed
more carefully than module code. **None of the three arrangements changes this list** — it comes
from running modules together in one browser page, not from how code is stored.

### 7.4 A bad release is already active on a vessel

Containment first: a failing module shows a contained message with a retry while the shell and
other modules keep working. Then the previous image — still in the ship-local registry — is
redeployed. Nothing is rebuilt and nothing comes from shore. Published versions are never
overwritten, which is why going back is predictable rather than a repair.

### 7.5 A team is late, two teams clash, or an urgent fix is needed

**A:** the release waits, or unfinished work is switched off first; timing must be agreed
between teams. This is the arrangement's weakest moment.
**B and C:** unaffected. The catalog keeps other modules at their approved versions, so an image
can go out with one module changed and the rest untouched.

### 7.6 Accommodation is six times larger than the other modules

188 screens against 31, with feature areas inside it. In **A** everyone working on those areas
shares one workspace with four other modules and the platform team. In **B and C** it has its
own space, pipeline and rhythm. Its size is the strongest single argument for giving at least
this module its own workspace.

### 7.7 An outside supplier provides a module

Fits **B and C** naturally: the supplier publishes to the registry like any team, is vetted,
and enters the catalog once approved — passing the same compatibility check. Their module is
packed into the image ashore, so the vessel never depends on the supplier's systems. In **A**
they would need access to everyone else's code, which is usually unacceptable. **If suppliers
are expected, that alone points to B or C.**

### 7.8 We choose now and change our mind later

Low risk. Moving a module between arrangements changes where its team publishes and one line in
the catalog. The image, safeguards, vessel and Operations' procedure are untouched. **Starting
with fewer separate workspaces and splitting later is reasonable and reversible.**

---

## 8. Side by side

| | **A — One workspace** | **B — One per module** | **C — Mixed** |
|---|---|---|---|
| Teams work without blocking each other | Limited | Fully independent | Independent where it matters |
| A stale version going out | Cannot happen | Possible — safeguards 2, 3 | Possible for separate modules — same safeguards |
| Modules disagreeing | Caught on a developer's machine | Caught at assembly by safeguard 4 | Caught at assembly by safeguard 4 |
| Effort to set up | Lowest | Highest | Moderate |
| Day-to-day developer effort | Lowest | Highest — publish, then update versions | Low in the shared group, higher outside it |
| Suits an outside supplier | No | Yes | Yes |
| Clear ownership when something breaks | Weakest | Strongest | Strong |
| Suits a module the size of Accommodation | Poorly | Well | Well |
| Speed from "finished" to "on a vessel" | Fastest | Slowest | In between |
| What the vessel receives | One approved image | One approved image | One approved image |
| Risk on the vessel | Identical | Identical | Identical |

The last two rows matter most: **this decision is about how teams work ashore, not about what
Operations installs or how a vessel behaves.**

---

## 9. Recommendation

**Option C — the mix.**

- **The platform team keeps the shell, shared libraries and contract together.** They change
  together and everything depends on them; separating them gains nothing.
- **Accommodation gets its own workspace.** Its size, contributor count and release rhythm
  justify it, and it is the module most held back by sharing a build.
- **The smaller modules follow team boundaries.** Where the platform team looks after Account,
  Commerce/Flights, Gangway and Gifts, they stay in the shared workspace and avoid the
  publishing overhead. A module moves out when it gets a genuinely separate team or supplier —
  one at a time.

**A** is sensible only while one team owns effectively everything: least machinery, and it
prevents 7.1 and 7.2 structurally rather than detecting them — but it does not survive several
teams or a supplier. **B** is worth it only once nearly every module has a different owner;
below that it adds daily work without adding independence anyone is asking for.

**Whichever is chosen, the drift check and compatibility check (safeguards 3 and 4) should exist
before the first module leaves the shared workspace.** They are the direct answers to the two
questions raised, and far cheaper to build up front than to add after a near miss.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Business module** | A self-contained part of the application — Accommodation, Account, Commerce/Flights, Gangway, Gifts. |
| **Application shell** | The outer application holding the modules; owns authentication, session, permissions, menu, routes, ship and voyage context, shared API client. |
| **Platform contract** | The agreed, versioned interface between shell and module — context, navigation, permissions, telemetry. |
| **Shared library** | Common UI components and utilities, published with version numbers and adopted deliberately. |
| **Private package registry** | Where finished, numbered builds are stored. Published versions are never modified. |
| **Release catalog** | The record of exactly which versions go into a given release. |
| **Release assembly** | Where finished builds are gathered, checked, recorded and packed into one image. |
| **Docker image** | One self-contained package — Nginx plus all static files for the shell and every module. What Operations installs. |
| **Ship-local registry** | Where approved images are held on the vessel, so activating or reverting needs no connection to shore. |
| **Approved window** | The agreed period during which Operations may promote a release. |
