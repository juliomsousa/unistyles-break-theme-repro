# unistyles-break-theme-repro

Minimal repro for a `react-native-unistyles@3.3.0` bug where styles from one component leak onto
another after `react-native-screens` freezes/unfreezes a screen during navigation.

## The issue

`react-native-unistyles` caches the last arguments passed to a shared dynamic style function
(one function reused by multiple components with different args). When `react-native-screens`
freezes a screen 2+ levels deep in a native-stack and later unfreezes it, that cached style gets
recomputed with the wrong (most-recently-used) arguments instead of its own — so an unrelated
screen's colors/alignment "leak" onto it.

This app has a single native stack (`Home -> Step1 -> Step2 -> Step3`) and one shared style
function (`src/SharedText.tsx`). `Home`, `Step1`, and `Step2` all use it with the same args
(green, left-aligned); `Step3` uses different args (white, centered). If the bug is present,
after enough freeze/unfreeze cycles `Home`, `Step1`, or `Step2` renders white + centered instead
of green + left-aligned.

See [UNISTYLES_REPRO_SPEC.md](./UNISTYLES_REPRO_SPEC.md) for the full investigation and design
rationale.

## Environment

| Package                           | Version                                        |
| ---------------------------------- | ----------------------------------------------- |
| `react-native`                     | 0.87.1                                          |
| `react`                             | 19.2.3                                          |
| `react-native-unistyles`           | 3.3.0 (bug) / 3.2.5 (no repro)                  |
| `react-native-nitro-modules`       | 0.37.1                                          |
| `react-native-screens`             | 4.28.0                                          |
| `@react-navigation/native-stack`   | 7.19.2                                          |
| Architecture                       | New Architecture / Fabric (default in RN 0.87)  |
| Platform tested                    | iOS Simulator (iPhone 17 Pro, iOS 26.2), Release build recommended |

## Installation

```sh
npm run build:ios      # npm install + bundle install + pod install + run iOS app
npm run build:android  # npm install + run Android app
```

`build:ios` runs `bundle install`/`bundle exec pod install` rather than a bare `pod install` so
CocoaPods resolves to the exact version pinned in [Gemfile](./Gemfile) (which excludes known-broken
releases) instead of whatever `pod` happens to be installed globally — keeping the repro
reproducible across machines.

## How to reproduce

1. From `Home`, tap "Push" through `Step1 -> Step2 -> Step3` (this freezes `Home` and `Step1`).
2. Wait a second or two for the freeze to take effect.
3. Tap "Back" repeatedly to walk back one screen at a time (`Step3 -> Step2 -> Step1 -> Home`),
   pausing briefly on each screen to check its text color/alignment against the expected
   green + left-aligned state.
4. Repeat the push/back cycle 5-10 times — per
   [#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252), the corruption
   compounds across cycles rather than showing up on the first one.

If the bug is present, one or more screens will render white + centered instead of green +
left-aligned.

## Video demonstration

| `3.3.0` (bug present)                                  | `3.2.5` (no repro)                                       |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| <video src="./media/bug-3.3.0.mp4" controls width="300"></video> | <video src="./media/fixed-3.2.5.mp4" controls width="300"></video> |

See [media/README.md](./media/README.md) for the expected filenames if the videos aren't showing.

To confirm the bisection, run each branch's build:

```sh
npm run demo:main   # checks out main (unistyles 3.3.0, bug present) and builds/runs iOS
npm run demo:fixed  # checks out fixed-3.2.5 (unistyles 3.2.5, no repro) and builds/runs iOS
```

`fixed-3.2.5` is a branch identical to `main` except `react-native-unistyles` is pinned to
`3.2.5`. Both scripts run `git checkout` then `npm run build:ios`, so make sure you have no
uncommitted changes before running them.

On `3.2.5` the same cycles should never show cross-contamination — this isolates the regression
to [commit `4d46223`](https://github.com/jpudysz/react-native-unistyles/commit/4d4622379e10e82e7a744e5d3b66c2a0456826b8)
("feat: add support for react-navigation inactive behaviour"), shipped in `3.3.0`.

## Related upstream reports

- [#1217](https://github.com/jpudysz/react-native-unistyles/issues/1217)
- [#1234](https://github.com/jpudysz/react-native-unistyles/pull/1234)
- [#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191) (closed, unmerged for lack
  of a reproduction)
- [#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252)

Patches from #1234 and #1191 were tested against `3.3.0` and neither fixed this variant (style
cross-contamination, rather than a crash) — see [UNISTYLES_REPRO_SPEC.md](./UNISTYLES_REPRO_SPEC.md)
for details.

