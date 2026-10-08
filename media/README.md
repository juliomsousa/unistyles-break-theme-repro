# Video demonstrations

The root [README.md](../README.md) embeds these GIFs inline (GitHub doesn't reliably render
`<video>` tags pointing at repo-committed files, but GIFs render natively via markdown image
syntax):

- `bug-3.4.0-bold-link.gif` — the repro cycle (section "How to reproduce" in the root README) run
  on `react-native-unistyles@3.4.0`, showing `Link.Bold` text turning regular while `BodyBold`
  stays bold.
- `fixed-3.2.5-bold-link.gif` — the same cycle on `react-native-unistyles@3.2.5`, with every
  sample keeping its labelled weight.

`bug-3.3.0.gif` and `fixed-3.2.5.gif` are from the earlier style-leak issue
([#1262](https://github.com/jpudysz/react-native-unistyles/issues/1262), fixed in `3.4.0`) and are
no longer embedded.
