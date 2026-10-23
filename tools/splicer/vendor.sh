#!/usr/bin/env bash
# Refreshes vendor/splicer from the published ComponentizeJS package. The splicer must match
# the vendored engine hooks in runtime/fastedge/builtins/embedding/ — bump both together.
set -euo pipefail
VERSION=0.23.0
cd "$(dirname "$0")"
OUT=../../vendor/splicer
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
(cd "$TMP" && npm pack -q "@bytecodealliance/componentize-js@$VERSION" >/dev/null && tar xzf ./*.tgz)
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r "$TMP"/package/lib/spidermonkey-embedding-splicer.* "$TMP"/package/lib/interfaces "$TMP"/package/LICENSE* "$OUT"/
