# Unistyles 3.4.0 update - discussion notes (resume later)

Date: 2026-10-05

## 1. Upstream issue analysis (jpudysz/react-native-unistyles#1262)

**Issue:** "[3.3.0] Styles leak between unrelated components sharing one dynamic function after screen freeze/unfreeze". Opened by us (juliomsousa). Closed by maintainer with "Fixed in 3.4.0" (no linked commit/PR). Related: #1217, #1234, #1191, #1252.

**3.4.0 changes relevant to the issue** (`v3.3.0...v3.4.0`, 22 commits):

| Commit | Change |
|---|---|
| `d5f8a85` (seba1342, PR #1260) | `HybridShadowRegistry::link()` restores per-view arguments/variants before saving native styles ("shared cache can belong to another view by the time React attaches refs") |
| `a8d5146` (seba1342, PR #1260) | Uses `rebuildUnistyleWithVariants(rt, unistyleData)` so the shared per-key `unistyle->parsedStyle` is not overwritten |
| `9afc15b` (PR #1266) | Linked `ShadowNodeFamily` kept alive via `shared_ptr`; pending updates drained with `takeUpdates()` (replaces the #1191 approach); stale families swept |
| `84222f0` | Takes RN `nativePropsMutex` when writing `nativeProps_DEPRECATED` (RN >= 0.86.1), thread-safety only |

Release also requires RN >= 0.81 (we are on 0.87.1). 3.4.0 builds against nitro 0.37.1 (we already have 0.37.1).

**Root cause of the colour leak (confirmed by diff):** in 3.3.0, `link()` initialised a view's `parsedStyle` from the shared `unistyle->parsedStyle`, which the dynamic-function proxy (`createDynamicFunctionProxy` in `Parser.cpp`) overwrites on every call (last caller wins). On re-link after unfreeze (`wasSuspended` -> initial update) the last caller's style (Step3: white/centred) was pushed to unrelated views. 3.4.0 rebuilds each view from its own `dynamicFunctionMetadata`. This also explains why the earlier #1234/#1191 patch attempts failed (see `/memories/repo/HAP-13529-style-corruption.md`).

**Not covered upstream:** no regression test; `mergeNativeProps` still merges rather than replaces (an `undefined` prop can't clear a merged value); the shared cache still exists in the proxy and the dependency-rebuild path wasn't reviewed.

**Result in our app:** colour issue is solved (confirmed by user with screenshots).

## 2. Dependency update plan (NOT executed yet)

Current state (as of last check): on `main`, up to date with origin; `package.json` has an **uncommitted** change `"react-native-unistyles": "3.2.5"` -> `"3.4.0"`. 3.4.0 is the latest published version. `pnpm-lock.yaml` and `ios/Podfile.lock` still point to 3.2.5. (3.2.5 was pinned by commit `5feac54b3` "fix: style corruption after navigation (#3580)".)

Conventions from history:
- Commits: `build: <verb> <pkg>`, lowercase, no scope (e.g. `build: upgrade askar`, `build: update repack`, `build: update datadog to support xcode 27`). `(#NNNN)` is added by squash merge.
- Branches: `<type>/<kebab-name>` (e.g. `build/update-askar`).
- Such commits touch `package.json`, `pnpm-lock.yaml`, `ios/Podfile.lock` (+ `pnpm-workspace.yaml` / `patches/` when a patch is added/removed).

Planned steps:
1. Create branch `build/update-unistyles` from `main` (keep the existing `package.json` edit).
2. `pnpm install` (updates `pnpm-lock.yaml`).
3. `pnpm pod` (updates `ios/Podfile.lock`). Check the `react-native-worklets` symlink first (known pnpm issue, see user memory notes).
4. `pnpm lint && pnpm typecheck && pnpm test` (tests mock unistyles, so they don't prove the freeze fix).
5. Stage only `package.json`, `pnpm-lock.yaml`, `ios/Podfile.lock` (+ related files), show diffstat.
6. Commit: `build: update unistyles to fix style corruption on freeze` (shorter alternative: `build: update unistyles`).
7. Do not push / open PR unless asked.

Open questions for the user: include `HAP-13529` in branch/commit name? Run lint/typecheck/tests before committing or only install + pod install?

Manual verification still needed (native rebuild, iOS + Android): Home -> Step1 -> Step2 -> Step3, wait 1-2 s, back one screen at a time, repeat several cycles with `enableFreeze(true)` (`src/App.tsx:63`).

## 3. New problem after 3.4.0: bold links turn regular after navigation

Symptom (screenshots): after navigating away and back, `Link.Bold*` text ("Next appointments", "Medicines", "Health A to Z", "See more in my health", "Get Active", "Quit smoking") renders with regular weight. Headings stay bold.

**Cause (from installed 3.4.0 source + Node simulation; not reproduced at runtime):**
- `ShadowRegistry.add` (`node_modules/react-native-unistyles/src/specs/ShadowRegistry/index.ts`) only flattens the style prop two levels (`.flat()` ... `.filter(...).flat()`).
- `Link.Bold*` nests styles 4 levels deep: `[typoDyn, [linkDyn, [regularL, [boldL, undefined]]]]` -> flattened result `[typoDyn, linkDyn, regularL, [boldL, null]]`.
- In C++ `unistyleFromValue`, the leftover array has no native state and no `unistyles_*` keys, so it is wrapped as an "exotic" (RN/inline) unistyle that never gets a `parsedStyle` -> skipped by `parseStylesToShadowTreeStyles`.
- The recomputed update on unfreeze (`wasSuspended` in `link()`) therefore has `fontWeight: regular` from `Typography.styledText` and no bold; it is merged into native props and overrides the JS-rendered bold.
- 3.2.5 never recomputed on re-link from suspended (initial update only for scoped themes) so the bug couldn't appear. 3.3.0 added the recompute (`4d46223`); 3.4.0 fixed the colours but still drops the deep-nested bold style. (3.3.0 source not checked for this.)
- Not affected: `Heading` (dynamic style), `Body.Bold*` (max nesting 3 levels, covered by two flattens). Affected: all `Link.Bold*` (~60 usages in ~25 files) and `Link.Regular*` when the `style` prop is an array.

Relevant code: `src/components/Typography/Link.tsx` (`buildBoldComponent` wraps `styles.boldX` in extra array levels), `Typography.tsx` (`styles.styledText` dynamic function with `fontWeight` default `'regular'`), `Body.tsx`.

## 4. Fix options (decision pending)

1. **App-side (recommended):** make `Link.Bold*` pass `fontWeight="bold"` to `Typography` (weight travels in the dynamic function args, always preserved) and drop the static `bold*` styles. `LinkProps` already omits `fontWeight`, so call sites can't override it. One change fixes all ~60 usages.
2. Flatten in `Link`: build one flat array in `buildBoldComponent` (regular + bold + user style at the same level). Other deep nestings stay fragile.
3. Patch the library: `styles.flat()` -> `flat(Infinity)` in `add` via `pnpm patch` (fixes every component but adds a patch to maintain; Metro may serve a stale bundle after patching, see notes in user memory).

Also worth reporting upstream: one-line fix in `ShadowRegistry.add`; no existing issue found.

Any change to `Link.tsx` needs the same freeze/unfreeze navigation test on iOS and Android.

## 5. Where to resume

- Decide the fix option for section 4 (and whether it goes on the update branch as a separate commit after the update commit).
- Execute section 2 plan (branch, install, pod install, checks, commit).
- Run the manual freeze/unfreeze verification on iOS and Android.
- Optionally open an upstream issue for the `ShadowRegistry.add` flattening depth.
- Related notes: `/memories/repo/HAP-13529-style-corruption.md`.
