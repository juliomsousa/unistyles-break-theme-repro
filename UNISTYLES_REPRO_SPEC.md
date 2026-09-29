# Unistyles freeze/navigation style-corruption — repro app spec

## Goal

A minimal, public, npm-only React Native app that:

1. Reliably reproduces the style corruption on `react-native-unistyles@3.3.0`.
2. Does **not** reproduce it on `react-native-unistyles@3.2.5` (bisected proof).
3. Reproducible with a short, deterministic manual sequence (Push/Back buttons), no automated
   driver required.

## Why this matters for getting it merged

On [unistyles#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191), the maintainer
(`jpudysz`) refused to merge a correct-looking fix because he couldn't run and verify it himself:

> "I can't merge it without a reproduction ... The only option for every bug is to reproduce it,
> create a patch and confirm if it works and has no regression."

A minimal, easy-to-follow repro removes that objection entirely.

## Source of this bug: prior investigation (read this before building the repro)

This bug ("Style breaks moving among the tabs") was originally found and investigated in a
production React Native app (details kept out of this public repro; only the technical findings
matter here).

All investigation notes (root cause candidates, confirmed findings, failed patch attempts) are
captured below — everything relevant is inline in this spec, nothing external to reference. Key
facts that matter for building a repro that **actually reproduces the bug**:

- **Troubleshooting note**: the initial report described it as breaking "moving among the tabs",
  which is misleading — switching bottom tabs back and forth never reproduced it in isolation.
  What actually reproduced it was **navigating through stack screens**, i.e. pushing several
  screens deep on a native-stack navigator (inside a tab) and then popping back, not just
  switching tabs. Bottom-tab switching was a red herring from the original bug report; the real
  trigger is stack push/pop depth, confirmed by deliberately testing tab-switch-only vs
  stack-push/pop-only scenarios separately.
- **Confirmed trigger**: `enableScreens(true)` + `enableFreeze(true)` in the app's entry point.
  Setting `enableFreeze(false)` **eliminates the bug completely on both iOS and Android** — this
  is the single most load-bearing config flag. If your repro doesn't call `enableFreeze(true)`,
  it will never reproduce this, no matter what else you do.
- **`detachInactiveScreens` on bottom tabs is NOT required** — confirmed by
  direct testing. Don't waste repro complexity wiring up tabs; a plain native-stack with enough
  depth is sufficient (see section 3).
- **Two upstream patches were tried against the original app and both FAILED to fix it**, despite looking
  correct and being confirmed compiled/linked into a fresh native build:
  - jpudysz/react-native-unistyles#1234 (strip `OFFSCREEN_TAG` from `isInsideSuspendedBoundary`)
  - jpudysz/react-native-unistyles#1191 (`takeUpdates()` drain + `isActiveUnistylesFamily()`
    filter in the C++ shadow tree / registry code)
  This means the popular "stale shadow-tree replay onto a recycled `ShadowNodeFamily`" theory
  (issues #1217/#1234/#1191/#1252) may **not** be the actual mechanism for this symptom, even
  though the surface symptom looks identical. Don't assume a repro that matches those issues'
  described mechanism will necessarily reproduce this one — the freeze/unfreeze cycle itself is
  the confirmed necessary trigger, the internal C++ explanation is not confirmed.
- **Leading (untested) theory, and the one this repro's design should target**: unistyles'
  `cxx/parser/Parser.cpp` (`createDynamicFunctionProxy`) caches a dynamic style function's
  *last-called arguments globally per style key* (there's literally a comment in that file:
  "for compatibility purpose save last arguments to style instance"). A shared `Typography`-style
  component defining **ONE shared dynamic function** (e.g. `styles.styledText`) that is called by
  *every* `Text`-based component app-wide (`Heading`, `Body`, `Caption`, `ButtonTitle`, etc.) each
  with different `color`/`alignCenter` args, triggers the same class of bug. When a
  freeze/unfreeze cycle forces a rebuild (`rebuildUnistyle`), that ONE shared function gets
  re-invoked with whichever args happen to be cached from *some other, unrelated caller* — not
  the frozen component's own args — and the result is pushed to every node using that style key.
  That matches the exact real-world symptom: a `Home` screen's text coming back styled with
  another component's `color='white'` + `alignCenter` args instead of its own.
  **Implication for this repro**: the more distinct call-sites you route through the *same*
  shared dynamic function (with visually distinct args), the more likely you are to reproduce the
  leak — a single Home-vs-Step3 pair (section 4 below) is the minimum viable version, but if that
  doesn't reproduce reliably, add several more call-sites of the same shared function scattered
  across the stack, mirroring how a shared `Typography` component is used app-wide rather than in
  just two places.
- **Fix applied upstream of this repro**: `enableFreeze(false)` was tried first and confirmed to
  fix it, but was **rejected** — it costs real freeze/perf benefits (offscreen screens keep
  re-rendering instead of being frozen), which wasn't an acceptable trade-off. Downgrading
  `react-native-unistyles` back to `3.2.5` while keeping `enableFreeze(true)` was used instead.
  This is exactly why this repro spec's bisection goal (section "Goal", item 2) targets 3.2.5 as
  the known-good version — that's not an arbitrary choice, it's a fix that was actually applied.
  Don't be misled into thinking `enableFreeze(false)` is the "real" fix to replicate; it's a
  rejected workaround, only useful here as a secondary bisection knob (see section 7) to further
  isolate the trigger, not as the recommended fix.

## 0. Bare RN project setup (do this first)

Uses RN 0.87.1, React 19.2.3, New Architecture/Fabric on by default, React Navigation 7,
react-native-screens 4.x, Nitro Modules 0.37.x. Use plain `npm` throughout — kept off pnpm/yarn
so the repro is as easy as possible to install and run.

```bash
# 1. Scaffold a bare RN CLI project (no Expo) pinned to the same RN version
npx @react-native-community/cli init UnistylesFreezeRepro --version 0.87.1
cd UnistylesFreezeRepro

# 2. Confirm New Architecture is on (default in 0.87+)
#    - android/gradle.properties -> newArchEnabled=true
#    - ios/Podfile -> ENV['RCT_NEW_ARCH_ENABLED'] ||= '1' (or just default true)

# 3. Install navigation + screens + gesture/safe-area deps (bottom-tabs is optional, see spec section 3)
npm install @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context react-native-gesture-handler

# 4. Install Nitro Modules + Unistyles, pinned to the buggy version first
npm install react-native-nitro-modules
npm install react-native-unistyles@3.3.0

# 5. iOS native install
cd ios && bundle install && bundle exec pod install && cd ..
# (or: npx pod-install)

# 6. Babel plugin for Unistyles (add to babel.config.js plugins array)
#    ['react-native-unistyles/plugin', { root: 'src' }]
```

Minimal `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-unistyles/plugin', {root: 'src'}],
    'react-native-reanimated/plugin', // only if you add reanimated; otherwise omit
  ],
}
```

Minimal `src/theme.ts` (only what the repro needs):

```ts
import {StyleSheet} from 'react-native-unistyles'

const theme = {
  colors: {
    green: '#02594C',
    white: '#FFFFFF',
  },
}

StyleSheet.configure({
  themes: {app: theme},
  settings: {initialTheme: 'app'},
})
```

`App.tsx` entry point (freeze/screens config, matches this repo's root-level `App.tsx`):

```tsx
import './src/theme'
import {NavigationContainer} from '@react-navigation/native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {enableFreeze, enableScreens} from 'react-native-screens'
import {RootNavigator} from './src/RootNavigator'

enableScreens(true)
enableFreeze(true)

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
```

Then build the `src/` files described in section 2 below (`SharedText.tsx`, `HomeScreen.tsx`,
`StepScreen.tsx`, `ButtonLikeScreen.tsx`, plus a `RootNavigator.tsx` wiring the flat native stack
from section 3 — no tabs, no automated driver), and run:

```bash
npm run ios       # or: npx react-native run-ios --simulator "iPhone 17 Pro"
npm run android   # or: npx react-native run-android
```

To bisect later, swap the pinned version and reinstall native deps:

```bash
npm install react-native-unistyles@3.2.5
cd ios && bundle exec pod install && cd ..
```

## 1. Tech stack (minimal, public-only)

- `react-native` (match a recent version family, e.g. 0.87.x) + New Architecture/Fabric
- `@react-navigation/native` + `native-stack` (`bottom-tabs` is optional, see section 3 — tab
  switching is not the trigger)
- `react-native-screens` (latest), `enableFreeze(true)`, `enableScreens(true)`
- `react-native-unistyles` — pin to `3.3.0` on `main`, no other native deps at all (no Firebase,
  no chat, nothing app-specific)
- Plain Expo (bare, no expo-router) or plain RN CLI — whichever gets a runnable Release build
  fastest, since some upstream reporters found Debug builds don't reproduce it as reliably as
  Release

## 2. Project structure

```
unistyles-freeze-repro/
├── App.tsx                 # NavigationContainer + enableScreens/enableFreeze
├── src/
│   ├── SharedText.tsx       # the ONE shared dynamic-function style (see below)
│   ├── HomeScreen.tsx       # renders SharedText with color=green (Push button only)
│   ├── StepScreen.tsx       # generic Step1/Step2 screen, same green style + Push/Back buttons
│   ├── ButtonLikeScreen.tsx # Step3 - renders SharedText with color=white, alignCenter=true + Back
│   ├── RootNavigator.tsx    # flat native-stack: Home -> Step1 -> Step2 -> Step3, no tabs
│   └── types.ts             # RootStackParamList
├── README.md                # repro steps, environment, links to related issues
└── package.json
```

Navigation is driven manually via "Push"/"Back" buttons on each screen — there is no automated
driver (see section 5).

## 3. Navigation setup — the actual trigger is stack depth, not tabs

**Switching bottom tabs alone does not trigger this bug.** `detachInactiveScreens` (used on
bottom tabs) only detaches the *native view* of an inactive tab — a separate, unrelated
optimization. The bug needs `enableFreeze()`'s `freezeOnBlur` behavior, which only kicks in on a
**native-stack** screen once it is two or more screens below the currently focused one. Tab
switching by itself never puts a screen in that state.

Minimal, reliable trigger (matches jpudysz/react-native-unistyles#1252's own repro steps, which
use no tabs at all):

- A single `createNativeStackNavigator()` with **4 screens**: `Home -> Step1 -> Step2 -> Step3`.
  Don't stop at 2-3 — go to at least 4 so `Home` is unambiguously 2+ levels below the focused
  screen and definitely frozen, not just borderline.
- `enableScreens(true)` + `enableFreeze(true)` at the top of `App.tsx`, nothing else — no scoped
  themes, no runtime theme switching, to isolate the pure-navigation trigger (as opposed to the
  theme-change trigger in #1179/#1191).


**Bottom tabs are optional.** If you want to mirror a production app's structure more closely,
wrap the stack above inside one tab of a `createBottomTabNavigator()`, but the repro must not
depend on tab switching — only on the stack push/pop depth. If you do add tabs, leave
`detachInactiveScreens` off here so it isn't a confounding variable.

## 4. The critical component — shared dynamic function

This is the part most likely to actually reproduce the symptom (style cross-contamination between
unrelated components, not a crash). It mirrors how a shared `Typography`-style component is
typically used app-wide in a production app — **ONE** shared dynamic function called by every
text-based component with different args — do not give each screen its own dynamic function, that
would defeat the whole point:

```tsx
// SharedText.tsx - ONE dynamic function, called with different args by different screens
const styles = StyleSheet.create(theme => ({
  styledText: ({color, alignCenter}: {color: string; alignCenter: boolean}) => ({
    color: theme.colors[color],
    textAlign: alignCenter ? 'center' : undefined,
  }),
}))

export const SharedText = ({color, alignCenter, children}: Props) => (
  <Text style={styles.styledText({color, alignCenter})}>{children}</Text>
)
```

- `HomeScreen` renders `<SharedText color="green" alignCenter={false}>Home</SharedText>`
- `ButtonLikeScreen` (pushed deep in the stack) renders
  `<SharedText color="white" alignCenter>Button</SharedText>`
- If cross-contamination is the bug, after some freeze/unfreeze cycles Home's text renders
  white+centered instead of green+left — visually obvious and easy to screen-record.
- **If this minimal 2-caller version doesn't reproduce reliably**, widen it: add `SharedText`
  calls to `Step1` and `Step2` too (this repro does, with the same green args as `Home`), so there
  are 4 distinct call-sites of the *same* shared function competing for the cached last-args, not
  just 2 — the more call-sites, the more likely the stale-args race is hit.

## 5. Manual navigation driver (no automated runner)

Each screen (`Home`, `Step1`, `Step2`, `Step3`) has its own "Push"/"Back" buttons. The repro cycle
is run by hand: push `Home -> Step1 -> Step2 -> Step3` (freezes `Home` and `Step1`, both 2+ screens
below the focused `Step3`), wait a beat for the freeze to take effect, then tap "Back" repeatedly
to walk back one screen at a time (`Step3 -> Step2 -> Step1 -> Home`) rather than jumping straight
home — each screen unfreezes as you leave it, so watch all of them, not just `Home`.

Repeat this push/back cycle by hand. Per #1252's own findings, the corruption/cost compounds after
the first cycle, so plan for at least 5-10 cycles, not just one — the first cycle alone may not
show anything.

## 6. Make the corruption detectable, not just visual

Give each screen's text a `testID` (`home-text`, `step1-text`, `step2-text`, `button-like-text`)
so it can be inspected/asserted on. Simple visual inspection is enough for a maintainer-facing
repro; automation-grade assertions are a nice-to-have.

## 7. Version bisection built into the repro

Implemented as two branches plus two `npm` scripts:

- `main` (3.3.0, broken) and `fixed-3.2.5` (identical except `react-native-unistyles` pinned to
  `3.2.5`, and `package-lock.json` refreshed to match).
- `npm run demo:main` (`git checkout main && npm run build:ios`) and
  `npm run demo:fixed` (`git checkout fixed-3.2.5 && npm run build:ios`) so switching versions and
  rebuilding is a single command, no manual `pod install`/version juggling required.

This bisection is the single most valuable thing to hand the maintainer — concrete, falsifiable,
and points straight at commit
[`4d46223`](https://github.com/jpudysz/react-native-unistyles/commit/4d4622379e10e82e7a744e5d3b66c2a0456826b8)
("feat: add support for react-navigation inactive behaviour").

## 8. README contents

- Environment table (RN, unistyles, nitro-modules, react-native-screens versions, platform)
- Exact steps (push through to Step3, walk back one screen at a time with "Back", repeat 5-10
  cycles, watch each screen's text)
- Screen recording (or GIF)
- Explicit note bisecting to 3.3.0 vs 3.2.5
- Links to related upstream reports:
  - [#1217](https://github.com/jpudysz/react-native-unistyles/issues/1217)
  - [#1234](https://github.com/jpudysz/react-native-unistyles/pull/1234)
  - [#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191) (closed)
  - [#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252)
- Note that both #1234's and #1191's patches were applied and confirmed compiled into a fresh
  native build in a real production app (not just theoretically) and neither fixed this variant —
  strong evidence the shadow-node-family replay theory isn't the actual mechanism here, and the
  Parser.cpp cached-last-args theory (section "Source of this bug") is more likely.

## 9. Where to submit

This may be a distinct symptom (style cross-contamination, not a crash) from the existing issues.
Prefer opening a **new issue** rather than commenting on a closed PR:

- Title: "[3.3.0] Style cross-contamination between unrelated components sharing a dynamic
  function, after screen freeze/unfreeze"
- Cross-link #1217/#1234/#1191/#1252 as related-but-distinct
- Link the repro repo
