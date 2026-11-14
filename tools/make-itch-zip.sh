#!/bin/bash
# Packs the game for itch.io (an "HTML" project): dist/marsupial-mayhem-itch.zip with index.html at the
# top, plus css/ and js/. Nothing else (no tools, docs or tests). Upload it on itch.io yourself and
# tick "This file will be played in the browser". Wi-Fi play isn't available there (it needs the
# home-network share), and the game hides the WI-FI button on public websites by itself.
cd "$(dirname "$0")/.." || exit 1
mkdir -p dist
rm -f dist/marsupial-mayhem-itch.zip
zip -r -q -X dist/marsupial-mayhem-itch.zip index.html css js -x '*.DS_Store'
echo "Made dist/marsupial-mayhem-itch.zip ($(du -h dist/marsupial-mayhem-itch.zip | cut -f1))"
unzip -l dist/marsupial-mayhem-itch.zip | tail -1
