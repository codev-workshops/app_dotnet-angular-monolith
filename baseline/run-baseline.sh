#!/usr/bin/env bash
# Run the golden-dataset parity check against a running stack.
#
# Usage:
#   run-baseline.sh --generate [base_url]   # (re)generate committed golden set
#                                           #   from the monolith (default :5000)
#   run-baseline.sh [base_url]              # capture from target stack and diff
#                                           #   against golden (default gateway :5100)
#
# The target stack MUST be freshly seeded (no pre-existing orders). Set
# AUTH_TOKEN=<jwt> in the environment when hitting the JWT-protected gateway.
#
# Exit code 0 => byte-for-byte parity (after timestamp normalization).
# Exit code 1 => at least one diff; details printed. Investigate as a defect.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOLDEN="$HERE/golden"

if [ "${1:-}" = "--generate" ]; then
  BASE="${2:-http://localhost:5000}"
  echo "Generating golden dataset from $BASE"
  rm -rf "$GOLDEN"
  "$HERE/capture.sh" "$BASE" "$GOLDEN"
  echo "Golden dataset written to $GOLDEN"
  exit 0
fi

BASE="${1:-http://localhost:5100}"
if [ ! -d "$GOLDEN" ]; then
  echo "ERROR: no golden dataset at $GOLDEN. Run: $0 --generate <monolith_url>" >&2
  exit 2
fi

ACTUAL="$(mktemp -d)"
trap 'rm -rf "$ACTUAL"' EXIT

# Obtain a JWT from the gateway's identity endpoint (if present) so authorized
# endpoints can be reached. Ignored silently when the target has no /auth/token.
if [ -z "${AUTH_TOKEN:-}" ]; then
  tok="$(curl -s -X POST "$BASE/auth/token" -H 'Content-Type: application/json' \
    -d '{"username":"baseline","password":"baseline"}' 2>/dev/null \
    | jq -r '.token // empty' 2>/dev/null || true)"
  if [ -n "$tok" ]; then
    export AUTH_TOKEN="$tok"
    echo "Acquired gateway JWT for capture"
  fi
fi

echo "Capturing actual from $BASE"
"$HERE/capture.sh" "$BASE" "$ACTUAL"

fail=0
echo
echo "===== PARITY DIFF (golden vs actual) ====="
for gf in "$GOLDEN"/*.json "$GOLDEN"/status.txt; do
  name="$(basename "$gf")"
  af="$ACTUAL/$name"
  if [ ! -f "$af" ]; then
    echo "MISSING in actual: $name"; fail=1; continue
  fi
  if ! diff -u "$gf" "$af" > /tmp/diff.$$ 2>&1; then
    echo "DIFF: $name"
    cat /tmp/diff.$$
    fail=1
  fi
done
rm -f /tmp/diff.$$

if [ "$fail" -eq 0 ]; then
  echo "PARITY OK: all snapshots match golden byte-for-byte (after timestamp normalization)."
else
  echo "PARITY FAILED: diffs above must be root-caused to a composition depth/ordering/null mismatch."
fi
exit "$fail"
