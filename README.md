# unistyles-break-theme-repro

Minimal, self-driving repro for a `react-native-unistyles@3.3.0` style cross-contamination bug
triggered by `react-native-screens` freeze/unfreeze during navigation. See
[UNISTYLES_REPRO_SPEC.md](./UNISTYLES_REPRO_SPEC.md) for the full spec this app implements.

## What this app does

- A single native stack, no tabs: `Home -> Step1 -> Step2 -> Step3`. Tab switching is **not**
  the trigger for this bug (`detachInactiveScreens` only detaches an inactive tab's native view,
  a separate optimization) — the actual trigger is `enableFreeze()`'s `freezeOnBlur` behavior,
  which only kicks in once a native-stack screen is 2+ screens below the focused one. Going to
  `Step3` unambiguously freezes `Home`.
- One shared dynamic Unistyles style function (`src/SharedText.tsx`) called with different
  arguments by `HomeScreen` (`color="green"`) and `ButtonLikeScreen` (`color="white"`,
  `alignCenter`), pushed deep in the stack as `Step3`.
- `src/AutoRunner.tsx` drives `push Step1 -> push Step2 -> push Step3 -> wait for freeze ->
  pop to Home (single popToTop event)` in an infinite loop with no manual tapping, logging each
  cycle/phase to the console and to an on-screen status line. It lives outside the stack's
  `Screen`s so it keeps running while they're frozen. Manual "push"/"back to Home" buttons are
  also still on each screen if you want to drive it by hand instead.
- If the bug is present, after enough freeze/unfreeze cycles `HomeScreen`'s text
  (`testID="home-text"`) renders white + centered instead of green + left-aligned — visually
  obvious and easy to screen-record, and assertable via `testID`.

## Environment

| Package                          | Version                                        |
| --------------------------------- | ----------------------------------------------- |
| `react-native`                    | 0.87.1                                          |
| `react`                            | 19.2.3                                          |
| `react-native-unistyles`          | 3.3.0 (bug) / 3.2.5 (no repro)                  |
| `react-native-nitro-modules`      | 0.37.1                                          |
| `react-native-screens`            | 4.28.0                                          |
| `react-native-gesture-handler`    | 3.3.0                                           |
| `@react-navigation/native`        | 7.4.1                                           |
| `@react-navigation/native-stack`  | 7.19.2                                          |
| `react-native-safe-area-context`  | 5.10.0                                          |
| Architecture                      | New Architecture / Fabric (default in RN 0.87)  |
| Platform tested                   | iOS Simulator (iPhone 17 Pro, iOS 26.2), Release build recommended |

## Running it

```sh
pnpm install
cd ios && bundle install && bundle exec pod install && cd ..
pnpm ios:dev     # or: npx react-native run-ios --simulator "iPhone 17 Pro"
pnpm android
```

The app starts cycling automatically on launch — no interaction needed. Each cycle pushes through
`Step1 -> Step2 -> Step3`, waits ~400ms for `Home` to actually freeze, then pops back to `Home` in
a single event, with a ~1.5s cooldown before the next cycle so it's easy to watch. Per
[#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252), corruption compounds
across cycles rather than showing up on the first one, so watch for at least 5-10 cycles. Watch
`Home`'s text and the on-screen "cycle N: ..." status line at the bottom of the screen; a screen
recording over ~30s to a minute is enough to show a corrupted cycle if/when it happens.

## Bisecting to 3.2.5

The bisection is the most valuable part of this repro — it isolates the regression to
[commit `4d46223`](https://github.com/jpudysz/react-native-unistyles/commit/4d4622379e10e82e7a744e5d3b66c2a0456826b8)
("feat: add support for react-navigation inactive behaviour"), shipped in `3.3.0`.

```sh
pnpm add react-native-unistyles@3.2.5
cd ios && bundle exec pod install && cd ..
pnpm ios:dev
```

Rebuild and let it cycle the same way: on `3.2.5` the `Home` text should stay green + left-aligned
indefinitely, with no cross-contamination.

## Related upstream reports

- [#1217](https://github.com/jpudysz/react-native-unistyles/issues/1217)
- [#1234](https://github.com/jpudysz/react-native-unistyles/pull/1234)
- [#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191) (closed, unmerged for lack
  of a reproduction)
- [#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252)

Both #1234's and #1191's patches were tested against `3.3.0` and neither fixed this particular
variant (style cross-contamination between unrelated components sharing a dynamic style function,
rather than a crash) — see [UNISTYLES_REPRO_SPEC.md](./UNISTYLES_REPRO_SPEC.md) for details.

