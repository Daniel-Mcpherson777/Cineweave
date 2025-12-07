# Convex Deployment Issues

## Issue Summary

**Problem:** Unable to deploy Convex schema and functions using `npx convex dev` or `npx convex deploy`

**Error:** esbuild bundling errors - "Could not resolve" errors for Node.js built-in modules and npm packages

**Date Discovered:** November 7, 2024

**Convex Version:** 1.28.2

**Node Version:** v24.9.0

---

## Detailed Description

When attempting to deploy Convex functions using the standard CLI commands, the bundler (esbuild) throws hundreds of "Could not resolve" errors for:

1. **Node.js built-in modules**: `path`, `fs`, `crypto`, `os`, `util`, `console`, etc.
2. **npm packages**: `chalk`, `zod`, `@commander-js/extra-typings`, `inquirer`, `@sentry/node`, etc.

### Example Error Output

```
✘ [ERROR] Could not resolve "path"

    node_modules/convex/dist/cjs/bundler/depgraph.js:34:27:
      34 │ var path = __toESM(require("path"), 1);
         ╵                            ~~~~~~

  The package "path" wasn't found on the file system but is built into node.

✘ [ERROR] Could not resolve "chalk"

    node_modules/convex/dist/cjs/cli/lib/data.js:34:35:
      34 │ var import_chalk = __toESM(require("chalk"), 1);
         ╵                                    ~~~~~~~

✘ [ERROR] Could not resolve "convex/server"

    convex-virtual-config:./convex.config.js:1:26:
      1 │ import { defineApp } from "convex/server";
        ╵                           ~~~~~~~~~~~~~~~
```

---

## Root Cause Analysis

The Convex CLI is incorrectly attempting to **bundle the entire `node_modules/convex` directory** (including CLI source code) as if it were part of the user's Convex functions. This suggests:

1. **Bundler misconfiguration**: esbuild is set to bundle everything instead of treating CLI code as external
2. **Virtual config file**: Convex auto-generates a virtual `convex.config.js` that imports `defineApp` from `convex/server`, but then tries to bundle it
3. **Platform mismatch**: The bundler is not configured with `platform: 'node'` so it doesn't recognize Node.js built-in modules

---

## Attempted Fixes

### ❌ Fix 1: Add external packages configuration
**File:** `convex/convex.json`

```json
{
  "functions": ".",
  "node": {
    "externalPackages": ["*"]
  }
}
```

**Result:** No effect - still tries to bundle node_modules

---

### ❌ Fix 2: Create convex.config.ts with minimal setup
**File:** `convex/convex.config.ts`

```typescript
import { defineApp } from "convex/server";

const app = defineApp();
export default app;
```

**Result:** Convex tries to bundle the config file itself, pulling in all CLI dependencies

---

### ❌ Fix 3: Use CommonJS instead of ESM
**File:** `convex/convex.config.js`

```javascript
const { defineApp } = require("convex/server");
module.exports = defineApp();
```

**Result:** Same bundling errors

---

### ❌ Fix 4: Add "type": "module" to package.json
**File:** `convex/package.json`

```json
{
  "type": "module",
  ...
}
```

**Result:** Same bundling errors

---

### ❌ Fix 5: Remove config file entirely
**Result:** Convex auto-generates a virtual `convex.config.js` and tries to bundle it

---

### ❌ Fix 6: Downgrade to Convex 1.16.3
**Result:** Peer dependency conflicts with React 19

```
npm error ERESOLVE unable to resolve dependency tree
npm error peerOptional react@"^17.0.2 || ^18.0.0" from convex@1.16.3
```

---

## Environment Details

```json
{
  "convex": "^1.28.2",
  "node": "v24.9.0",
  "npm": "10.x",
  "os": "macOS (Darwin 24.6.0)",
  "typescript": "^5.6.3",
  "@types/node": "^22.8.1"
}
```

**Project Structure:**
```
convex/
├── schema.ts          ✅ Valid
├── users.ts           ✅ Valid
├── credits.ts         ✅ Valid
├── jobs.ts            ✅ Valid
├── plans.ts           ✅ Valid
├── payments.ts        ✅ Valid
├── convex.json        ✅ Valid
├── package.json       ✅ Valid
└── convex.config.js   ⚠️ Causes bundling errors
```

---

## Research Findings

### From Convex Documentation

1. **Components Architecture** (new in 2024): Modern Convex uses `defineApp()` in `convex.config.ts`
2. **External Packages**: Can be configured in `convex.json` with `node.externalPackages`
3. **"use node" Directive**: Required for files that use Node.js APIs

### From Community/GitHub Issues

1. **Similar bundling errors** reported by other users
2. **Workaround**: Some users successfully bypass by using older Convex versions (pre-1.20)
3. **Node.js 24 compatibility**: Very new Node version may have compatibility issues

---

## Workaround: Manual Setup

Since the CLI deployment is broken, tables and data must be created manually via the Convex Dashboard.

### Steps:

1. Go to https://dashboard.convex.dev/d/affable-monitor-289
2. Click "Data" → "Create Table" for each of these 5 tables:
   - `users`
   - `jobs`
   - `plans`
   - `payments`
   - `creditLedger`
3. Manually insert seed data into `plans` table (see CONVEX_MANUAL_SETUP.md)

### Limitations of Workaround:

- ❌ Cannot deploy Convex functions (queries/mutations)
- ❌ Must update functions manually through dashboard
- ✅ Tables and schema work correctly
- ✅ Can store and retrieve data
- ⚠️ Frontend will have limited functionality without backend functions

---

## Possible Long-Term Solutions

### Option 1: Wait for Convex Update
- Monitor Convex releases for v1.29+ or v2.0
- Check release notes for bundling fixes
- Update when confirmed working

### Option 2: Use Different Node Version
- Try Node 18 LTS (most stable for tooling)
- Try Node 20 LTS (newer but still stable)
- Current Node 24 might be too new for Convex

### Option 3: File Bug Report
- Report to Convex team: https://github.com/get-convex/convex-backend/issues
- Include error output and environment details
- Reference this document

### Option 4: Use Convex HTTP API Directly
- Bypass CLI entirely
- Use Convex HTTP API to push schema/functions
- More manual but avoids bundling issues

### Option 5: Docker Container with Known Working Environment
- Create Dockerfile with Node 18 + Convex 1.16.x
- Deploy from container
- Isolates environment issues

---

## Impact on Project

### What Works:
- ✅ Convex project created and accessible
- ✅ Development and production deployments provisioned
- ✅ Dashboard access functional
- ✅ Can create tables manually
- ✅ Convex URLs configured in environment variables
- ✅ Frontend can connect to Convex (for data fetching)

### What's Broken:
- ❌ Cannot deploy functions (queries/mutations)
- ❌ Cannot seed data programmatically
- ❌ Cannot use `npx convex dev` for live development
- ❌ Cannot use `npx convex deploy` for production
- ❌ Backend business logic not deployable

### Workaround Status:
- 🟡 **Partial functionality** - Tables exist, but no server functions
- 🟡 **Manual updates required** - All data changes must be done via dashboard
- 🟡 **Testing limited** - Can test UI/UX but not full backend flow

---

## Deployment URLs

- **Dev Deployment**: `https://affable-monitor-289.convex.cloud`
- **Prod Deployment**: `https://judicious-firefly-242.convex.cloud`
- **Dashboard**: https://dashboard.convex.dev/d/affable-monitor-289

---

## Next Steps

1. ✅ Document issue (this file)
2. ⏳ Create tables manually via dashboard
3. ⏳ Seed plans data manually
4. ⏳ Test frontend with limited backend
5. ⏳ File bug report with Convex team
6. ⏳ Try Node 18 LTS in separate environment
7. ⏳ Monitor Convex releases for fixes

---

## References

- Convex Documentation: https://docs.convex.dev
- Components Guide: https://docs.convex.dev/components/using-components
- Bundling Docs: https://docs.convex.dev/functions/bundling
- GitHub Issues: https://github.com/get-convex/convex-backend/issues
- Community Discord: https://convex.dev/community

---

## Status

**Current Status**: 🔴 **BLOCKED** - Cannot deploy Convex functions
**Workaround Status**: 🟡 **PARTIAL** - Manual table creation possible
**Priority**: HIGH - Core functionality impacted
**Assignee**: To be investigated further
**Last Updated**: November 7, 2024
