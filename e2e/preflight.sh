#!/bin/sh
# Exits nonzero unless exactly one Android device is attached and authorized. digital-qa's
# real_run_tests treats a nonzero exit here as AppDownError: the ticket blocks and retries
# next tick — it never reports a red test that's actually an unplugged or locked phone.
set -e

ADB="${ANDROID_HOME:+$ANDROID_HOME/platform-tools/adb}"
ADB="${ADB:-adb}"

COUNT=$("$ADB" devices | awk 'NR>1 && $2=="device" {c++} END{print c+0}')
if [ "$COUNT" -ne 1 ]; then
  echo "preflight: expected exactly one authorized device, found $COUNT" >&2
  "$ADB" devices >&2
  exit 1
fi
