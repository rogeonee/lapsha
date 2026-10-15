#!/bin/sh
set -eu

# Use fresh processes so Date and Intl both start in the requested timezone.
# The full suite already runs in UTC via `bun run test`.
for timezone in America/Edmonton Asia/Tokyo; do
  printf 'Running date suites in %s\n' "$timezone"
  TZ="$timezone" bun test \
    ./tests/dates.test.ts \
    ./tests/current-day.test.ts \
    ./tests/upcoming.test.ts
done
