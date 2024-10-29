#!/usr/bin/env bash

~/.cargo/bin/wit-bindgen c --out-dir runtime/fastedge/host-api/bindings --world bindings runtime/fastedge/host-api/wit
