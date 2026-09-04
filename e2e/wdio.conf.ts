import { execSync } from 'node:child_process';
import path from 'node:path';
import { driver } from '@wdio/globals';

// adb isn't on PATH in every shell that runs this (see e2e/preflight.sh's own comment) —
// resolve it the same way preflight.sh does, so `execSync('adb ...')` below doesn't silently
// ENOENT and get swallowed by onPrepare's catch, below.
const ADB = process.env.ANDROID_HOME
  ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb')
  : 'adb';

const APP_ID = 'com.demoapp';
const APK_PATH = path.join(
  __dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk',
);

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./specs/**/*.e2e.ts'],
  maxInstances: 1,       // one physical device — nothing to parallelize across
  port: 4723,
  services: [['appium', {}]],
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': APK_PATH,
      'appium:appPackage': APP_ID,
      // fullReset would reinstall (uninstall+install) every session, which is slower than
      // needed — onPrepare below uninstalls once per run instead, and beforeTest clears app
      // data between individual tests.
      'appium:fullReset': false,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
    },
  ],
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: ['spec'],

  onPrepare: function () {
    // android/app/build.gradle hardcodes versionCode 1 — with fullReset:false, Appium may
    // treat a same-versionCode APK as already installed and skip reinstalling, silently
    // testing a stale build after every rebuild. Uninstalling once up front (ignoring
    // failure when it isn't installed yet) forces every run to install the APK just built.
    //
    // Confirmed live 2026-09-04: this previously called bare `adb`, which isn't on PATH in
    // every shell that runs `npm run e2e` — the failure (ENOENT, not "not installed yet")
    // was swallowed by the catch below, so the uninstall silently never ran. Appium then saw
    // the same versionCode already installed and skipped reinstalling — every run tested a
    // stale APK from a prior session (once from 2026-09-03) instead of the one just built.
    // Confirmed by installedTime/lastUpdateTime on device staying frozen across two full
    // `npm run e2e` runs; a manual `adb uninstall` between runs immediately fixed it.
    try {
      execSync(`${ADB} uninstall ${APP_ID}`, { stdio: 'ignore' });
    } catch {
      // not installed yet — fine, Appium installs fresh either way.
    }
  },

  // Not `beforeEach` — that's a Mocha hook name, not one WebdriverIO's config recognizes
  // (the runner calls it `beforeTest`; see @wdio/types Services.beforeTest). A `beforeEach`
  // key here is silently ignored — confirmed live 2026-09-04: it never ran, todos piled up
  // across tests in the one shared session, and the 3rd test's `~text="Delete"]` match hit
  // the 1st test's row instead of its own, deleting the wrong todo.
  beforeTest: async function () {
    // The app persists todos to AsyncStorage — without this, one test's todos leak into
    // the next (the mobile equivalent of the web suite's shared-cart problem).
    // ponytail: 'mobile: clearApp' is appium-uiautomator2-driver's documented reset command.
    // The Phase 0 device spike (2026-09-04) saw this hook not fire at all (wrong hook name,
    // fixed above) and misread the resulting cross-test pollution as clearApp itself being
    // unreliable — it was never exercised, so that verdict doesn't stand. If a *future* run
    // shows pollution with this hook actually firing, the fallback is `adb shell pm clear
    // com.demoapp` via execSync, same place.
    await driver.execute('mobile: clearApp', { appId: APP_ID });
    await driver.activateApp(APP_ID);
  },
};
