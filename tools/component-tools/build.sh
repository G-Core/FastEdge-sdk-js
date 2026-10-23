#!/usr/bin/env bash
# Rebuilds vendor/component-tools from this crate: Rust → wasm32-wasip2 component → jco transpile,
# plus the licence files shipped with it. See context/development/VENDORED_TOOLS.md.
# Needs: rustup target add wasm32-wasip2; cargo install cargo-about --locked --features cli
set -euo pipefail
cd "$(dirname "$0")"
OUT=../../vendor/component-tools
cargo build --release --target wasm32-wasip2
# Fails on a licence not accepted in about.toml, before vendor/ is touched
cargo about generate about.hbs -o target/THIRD_PARTY_LICENSES.txt
rm -rf "$OUT"
npx -y @bytecodealliance/jco@1.39.0 transpile target/wasm32-wasip2/release/component_tools.wasm \
  -o "$OUT" --name component-tools
cp ../../LICENSE "$OUT/LICENSE"
cp target/THIRD_PARTY_LICENSES.txt "$OUT/"
