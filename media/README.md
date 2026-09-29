# Video demonstrations

The root [README.md](../README.md) embeds these GIFs inline (GitHub doesn't reliably render
`<video>` tags pointing at repo-committed files, but GIFs render natively via markdown image
syntax):

- `bug-3.3.0.gif` — the repro cycle (section "How to reproduce" in the root README) run on
  `react-native-unistyles@3.3.0`, showing a screen render white + centered instead of green +
  left-aligned.
- `fixed-3.2.5.gif` — the same repro cycle run on `react-native-unistyles@3.2.5`, showing no
  cross-contamination.
