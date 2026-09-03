# e2e conventions

Appium + WebdriverIO, run against a real Android device (no emulator on the dev machine).
`npm run e2e` builds a release APK, then runs the suite against whatever device `adb` sees.

## Selectors

- **Chrome and controls with a stable `accessibilityLabel`** (the todo input, the add
  button, an empty-state message, a filter toggle): query by accessibility id, `$('~name')`.
- **Repeated list content** (a todo row): query by its visible text —
  `$('//*[@text="Buy milk"]')`. Row ids are `todo-item-${Date.now()}`, unique per item and
  useless as a selector; this is intentional, not a gap to flag. See `specs/todo.e2e.ts`.
- **A control that belongs to one specific row** (its checkbox, its delete button) has no
  stable id either. Find it as the nearest clickable ancestor of that row's text node —
  `specs/todo.e2e.ts`'s `clickableAncestorOf` helper.

If a ticket's acceptance criteria need testing a *new* UI element with no stable id and it
isn't repeated list content, that's worth a stable `accessibilityLabel` on the element — not
a workaround in the test.

## Reset between tests

`beforeEach` in `wdio.conf.ts` calls `mobile: clearApp` — clears AsyncStorage without a
full reinstall, so one test's todos don't leak into the next. `onPrepare` uninstalls the app
once per run, so a same-`versionCode` rebuild (the app's `versionCode` is hardcoded to `1`)
is never skipped by Appium as "already installed."

## Commands

- `npm run build:android` — `gradlew assembleRelease`; prints `DIGITAL_QA_BUILD_FAILED` and
  exits nonzero on a build error (digital-qa's `repo.build_failed_marker` reads this to skip
  retrying a broken build as if it were a red test).
- `npm run e2e` — build, then `wdio run ./e2e/wdio.conf.ts`.
- `./e2e/preflight.sh` — exits nonzero unless exactly one authorized device is attached.
