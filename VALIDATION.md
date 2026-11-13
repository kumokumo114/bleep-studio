# Validation record

Checked locally on November 13, 2026.

## Automated unit checks

**9 passed, 0 failed** with Node's built-in test runner.

Coverage: catalog uniqueness, all recipes and parameter limits, seeded variation,
invalid/prototype palette names, WAV headers and PCM clipping, CRC32 check vector,
ZIP local/central directory consistency, UTF-8 names, empty archives.

Run: **npm test**.

## Browser audio rendering

Actual Web Audio rendering in the desktop app's Chromium-based browser.

- **216 successful renders**: 54 starting sounds × two default sample rates plus
  two parameter extremes per starting sound.
- All samples finite; every sound has nonzero signal.
- First and final sample zero; no peak above the 0.9 ceiling.
- Observed peak range: **0.0207567–0.638629**.
- Fixed-seed explosion rendered twice: **maximum sample difference 0**.
- Different seed produced different audio.

The suite also performs three additional renders for the repeatability comparison.
The count of 216 refers to the parameter/sample-rate matrix only.

Raw report: **docs/audio-validation.json**.

## Interaction checks

Verified sound selection/playback, keyboard pitch adjustment, independent settings
between palettes, browser persistence after reload, favorites, category filtering,
English/Chinese search, empty results, language switching, remix and reset, mute,
sample-rate switching, help dialog and the interactive playground.

Playground coin input updated the score to 0100; jump, damage and victory events
triggered their corresponding actions.

## File exports

Downloaded through the real app controls:

- Single 44.1 kHz WAV: read by Python's standard wave module.
- 44.1 kHz arcade ZIP: CRC validated, 20 entries, all 18 WAVs readable, manifest
  durations match sample counts, custom +1-semitone setting preserved.
- 48 kHz sci-fi ZIP exported while preview was muted: all 18 WAVs readable and
  non-silent, correct sample rate and format.

WAVs are mono, 16-bit PCM. The other two ZIP entries are manifest.json and README.txt.

## Responsive layout

Actual same-origin iframe CSS viewports at **375, 768, 1024 and 1440 px**.
Every layout retained all 18 sound cards and had no horizontal document overflow.
The 375 px view was also visually inspected.

Raw report: **docs/responsive-validation.json**.

## Limits of this validation

Firefox, Safari, physical iOS/Android devices and real assistive technology have
not been separately tested. Reduced-motion styles and keyboard semantics are
included, but this is not a formal accessibility certification.

The automation browser disallows file-protocol navigation, so direct double-click
opening was not exercised automatically. Runtime files use ordinary relative
scripts/styles and no fetch, modules or network dependencies. The localhost
preview is the verified execution path.

GitHub Pages publishing has not been run; the user's requested delivery is local.
