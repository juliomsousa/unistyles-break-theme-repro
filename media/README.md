# Video demonstrations

The root [README.md](../README.md) embeds `bug-3.3.0.gif`/`fixed-3.2.5.gif` inline (GitHub doesn't
reliably render `<video>` tags pointing at repo-committed files, but GIFs render natively via
markdown image syntax). The `.mp4` originals are kept alongside for full quality/audio:

- `bug-3.3.0.mp4` / `.gif` — the repro cycle (section "How to reproduce" in the root README) run
  on `react-native-unistyles@3.3.0`, showing a screen render white + centered instead of green +
  left-aligned.
- `fixed-3.2.5.mp4` / `.gif` — the same repro cycle run on `react-native-unistyles@3.2.5`, showing
  no cross-contamination.

Regenerate the GIFs from the mp4s with:

```sh
ffmpeg -i bug-3.3.0.mp4 -vf "fps=8,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" bug-3.3.0.gif
```
