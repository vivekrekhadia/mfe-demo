// Builds the Shell + all MFEs and assembles them into deploy/ as a single
// static bundle for hosts with no persistent server (Vercel/Netlify/Cloudflare
// Pages), replacing the Ship Server with a fixed manifest and a static mock
// session file. Used as the Vercel "Build Command" (see vercel.json) so
// connecting this repo to Vercel auto-deploys on every push.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Must include every name in @mfe/shared-types' MFE_NAMES — isMfeManifest()
// validates ANY manifest against that full list regardless of which target
// produced it, so leaving one out here doesn't just mean "that MFE is
// missing," it fails schema validation and breaks the whole Shell (every
// route, not just the missing one) on this target. signin-mfe's actual
// sign-in flow is unreachable on this static target anyway (see api/session.json
// below — it's a fixed always-200 stub, so AuthGate never has a reason to
// route to /signin), but it still has to be present in the manifest.
const MFES = ["bookings", "dining", "payment", "signin"];

function versionOf(appDir) {
  const pkg = JSON.parse(readFileSync(path.join(root, "apps", appDir, "package.json"), "utf8"));
  return pkg.version;
}

execFileSync(
  "pnpm",
  [
    "--filter", "./apps/shell",
    "--filter", "./apps/bookings-mfe",
    "--filter", "./apps/dining-mfe",
    "--filter", "./apps/payment-mfe",
    "--filter", "./apps/signin-mfe",
    "run", "build",
  ],
  { cwd: root, stdio: "inherit" },
);

const deployDir = path.join(root, "deploy");
rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });

cpSync(path.join(root, "apps/shell/dist"), deployDir, { recursive: true });

const manifestMfes = {};
for (const name of MFES) {
  const appDir = `${name}-mfe`;
  const target = path.join(deployDir, "mfe", name);
  mkdirSync(target, { recursive: true });
  cpSync(path.join(root, "apps", appDir, "dist"), target, { recursive: true });
  manifestMfes[name] = {
    version: versionOf(appDir),
    url: `/mfe/${name}/remoteEntry.js`,
  };
}

mkdirSync(path.join(deployDir, "config"), { recursive: true });
writeFileSync(
  path.join(deployDir, "config/mfe-manifest.json"),
  JSON.stringify(
    {
      release: "demo-static",
      activatedAt: new Date().toISOString(),
      mfes: manifestMfes,
    },
    null,
    2,
  ) + "\n",
);

mkdirSync(path.join(deployDir, "api"), { recursive: true });
writeFileSync(
  path.join(deployDir, "api/session.json"),
  JSON.stringify(
    { user: "J. Rivera (Guest 4021)", authenticatedVia: "ship-local-mock-session" },
    null,
    2,
  ) + "\n",
);

console.log(`Static demo bundle assembled at ${deployDir}`);
