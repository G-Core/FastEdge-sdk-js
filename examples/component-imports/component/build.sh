#!/usr/bin/env bash
# Rebuilds ../thumbnail.wasm (committed, so `npm run build` needs no Rust toolchain).
# Needs: rustup target add wasm32-wasip2
set -euo pipefail
cd "$(dirname "$0")"
cargo build --release --target wasm32-wasip2
cp target/wasm32-wasip2/release/thumbnail.wasm ../thumbnail.wasm
