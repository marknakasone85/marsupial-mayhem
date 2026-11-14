#!/bin/bash
# Runs the automated tests for Marsupial Mayhem with macOS's built-in JavaScript engine
# (no browser or installs needed).
#   tools/run-tests.sh          quick run (a few minutes)
#   tools/run-tests.sh --full   longer runs (once there are characters and maps to play through)
cd "$(dirname "$0")/.." || exit 1
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
[ -x "$JSC" ] || { echo "JavaScriptCore (jsc) not found - these tests need macOS."; exit 1; }

echo "Syntax check of every game file..."
bad=0
for f in $(find js -name '*.js'); do
  out=$("$JSC" -e "try { new Function(readFile('$f')); } catch (e) { print('$f: ' + e); }")
  [ -n "$out" ] && { echo "  $out"; bad=1; }
done
[ $bad -eq 0 ] && echo "  all files OK"

full=""
[ "$1" = "--full" ] && full="var FULL_RUN = true;"
failed=0
for t in boot settings looks editor boomer roster joey shop worlds twist topend campaign solo coop duel; do
  echo ""
  echo "== $t =="
  out=$("$JSC" -e "$full" tools/tests/harness.js "tools/tests/test_$t.js" 2>&1)
  echo "$out"
  echo "$out" | grep -qE "FAIL|Exception|Error:" && failed=1
done
echo ""
echo ""
echo "== share server =="
out=$(python3 -I tools/tests/test_server.py 2>&1)
echo "$out"
echo "$out" | grep -qE "FAIL|Traceback" && failed=1
echo ""
if [ $failed -eq 0 ] && [ $bad -eq 0 ]; then echo "ALL TESTS PASSED"; else echo "SOME TESTS FAILED"; exit 1; fi
