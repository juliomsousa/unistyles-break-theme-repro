# Unistyles freeze/navigation style-corruption — repro app spec

## Goal

A minimal, public, npm-only React Native app that:

1. Reliably reproduces the style corruption on `react-native-unistyles@3.3.0`.
2. Does **not** reproduce it on `react-native-unistyles@3.2.5` (bisected proof).
3. Runs itself automatically (no manual tapping needed).

## Why this matters for getting it merged

On [unistyles#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191), the maintainer
(`jpudysz`) refused to merge a correct-looking fix because he couldn't run and verify it himself:

> "I can't merge it without a reproduction ... The only option for every bug is to reproduce it,
> create a patch and confirm if it works and has no regression."

A hands-free, self-driving repro removes that objection entirely.

## 0. Bare RN project setup (do this first)

Mirrors this repo's stack (RN 0.87.1, React 19.2.3, New Architecture/Fabric on by default,
React Navigation 7, react-native-screens 4.x, Nitro Modules 0.37.x). Use `pnpm` throughout to
match this repo's tooling, but plain `npm`/`yarn` work the same.

```bash
# 1. Scaffold a bare RN CLI project (no Expo) pinned to the same RN version
npx @react-native-community/cli init UnistylesFreezeRepro --version 0.87.1
cd UnistylesFreezeRepro

# 2. Confirm New Architecture is on (default in 0.87+)
#    - android/gradle.properties -> newArchEnabled=true
#    - ios/Podfile -> ENV['RCT_NEW_ARCH_ENABLED'] ||= '1' (or just default true)

# 3. Install navigation + screens + gesture/safe-area deps (bottom-tabs is optional, see spec section 3)
pnpm add @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context react-native-gesture-handler

# 4. Install Nitro Modules + Unistyles, pinned to the buggy version first
pnpm add react-native-nitro-modules
pnpm add react-native-unistyles@3.3.0

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

`App.tsx` entry point (freeze/screens config, matches this repo's `src/App.tsx`):

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
`StepScreen.tsx`, `ButtonLikeScreen.tsx`, `AutoRunner.tsx`, plus a `RootNavigator.tsx` wiring the
bottom tabs + native stack from section 3), and run:

```bash
pnpm ios       # or: npx react-native run-ios --simulator "iPhone 17 Pro"
pnpm android   # or: npx react-native run-android
```

To bisect later, swap the pinned version and reinstall native deps:

```bash
pnpm add react-native-unistyles@3.2.5
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
│   ├── HomeScreen.tsx       # renders SharedText with color=green, alignCenter=false
│   ├── StepScreen.tsx       # a generic "push another screen" screen (reused, Step1/Step2)
│   ├── ButtonLikeScreen.tsx # Step3 - renders SharedText with color=white, alignCenter=true
│   └── AutoRunner.tsx       # the automated push-to-Step3-then-popToTop driver
├── README.md                # repro steps, environment, recording, links to related issues
└── package.json
```

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
- Push all the way to `Step3` (this freezes `Home`), then pop all the way back to `Home` in one
  shot with `navigation.popToTop()`, which unfreezes it in a single event — that's the moment the
  corruption appears.

**Bottom tabs are optional.** If you want to mirror a production app's structure more closely,
wrap the stack above inside one tab of a `createBottomTabNavigator()`, but the repro must not
depend on tab switching — only on the stack push/pop depth. If you do add tabs, leave
`detachInactiveScreens` off here so it isn't a confounding variable.

## 4. The critical component — shared dynamic function

This is the part most likely to actually reproduce the symptom (style cross-contamination between
unrelated components, not a crash):

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

## 5. Automated driver (no manual tapping)

A single button/effect that runs N cycles of:
`navigation.push('Step1') -> push('Step2') -> push('Step3')` (renders `ButtonLikeScreen`) ->
**wait ~300-500ms** (give react-native-screens time to actually freeze `Home` before popping —
popping too fast can skip the freeze entirely) -> `navigation.popToTop()` (a single unfreeze
event for `Home`, not a sequence of individual pops).

Loop this automatically with a short delay between cycles, and log the cycle number to the
console/on-screen. Per #1252's own findings, the corruption/cost compounds after the first cycle,
so plan for at least 5-10 automatic cycles, not just one — the first cycle alone may not show
anything.

## 6. Make the corruption detectable, not just visual

Give `HomeScreen`'s text a `testID` so it can be inspected/asserted on. Simple visual + console
log is enough for a maintainer-facing repro; automation-grade assertions are a nice-to-have.

## 7. Version bisection built into the repro

Make the Unistyles version trivially swappable:

- Two branches: `main` (3.3.0, broken) and `fixed-3.2.5` (working), or
- A README note: "run `pnpm add react-native-unistyles@3.2.5 && pod install`, rebuild, cycles no
  longer corrupt."

This bisection is the single most valuable thing to hand the maintainer — concrete, falsifiable,
and points straight at commit
[`4d46223`](https://github.com/jpudysz/react-native-unistyles/commit/4d4622379e10e82e7a744e5d3b66c2a0456826b8)
("feat: add support for react-navigation inactive behaviour").

## 8. README contents

- Environment table (RN, unistyles, nitro-modules, react-native-screens versions, platform)
- Exact steps (tap Auto-run, wait ~30s, watch Home text)
- Screen recording (or GIF)
- Explicit note bisecting to 3.3.0 vs 3.2.5
- Links to related upstream reports:
  - [#1217](https://github.com/jpudysz/react-native-unistyles/issues/1217)
  - [#1234](https://github.com/jpudysz/react-native-unistyles/pull/1234)
  - [#1191](https://github.com/jpudysz/react-native-unistyles/pull/1191) (closed)
  - [#1252](https://github.com/jpudysz/react-native-unistyles/issues/1252)
- Note that both #1234's and #1191's patches were tested on 3.3.0 and neither fixed this variant.

## 9. Where to submit

This may be a distinct symptom (style cross-contamination, not a crash) from the existing issues.
Prefer opening a **new issue** rather than commenting on a closed PR:

- Title: "[3.3.0] Style cross-contamination between unrelated components sharing a dynamic
  function, after screen freeze/unfreeze"
- Cross-link #1217/#1234/#1191/#1252 as related-but-distinct
- Link the repro repo
