# Runtime Architecture

## Overview

The FastEdge JS SDK includes a custom JavaScript runtime built on Mozilla's SpiderMonkey engine (via the StarlingMonkey project). This runtime compiles to WebAssembly and provides the execution environment for FastEdge applications on the edge platform.

The runtime lives in `runtime/` and produces two key artifacts:
- `lib/fastedge-runtime.wasm` — the JavaScript engine + custom builtins
- `lib/preview1-adapter.wasm` — WASI preview1 compatibility adapter

## StarlingMonkey

**Location:** `runtime/StarlingMonkey/` (git submodule)
**What it is:** Mozilla SpiderMonkey (Firefox's JS engine) compiled to `wasm32-wasip1`
**What it provides:** Standard Web API implementations — `fetch`, `Request`, `Response`, `Headers`, `URL`, `crypto`, streams, timers, `TextEncoder`/`TextDecoder`, etc.

StarlingMonkey is an upstream open-source project. FastEdge extends it with custom builtins (see below) rather than modifying it directly.

## Custom Builtins (C++)

FastEdge adds three builtin modules on top of StarlingMonkey, registered via CMake's `add_builtin()`:

### fastedge.cpp — FastEdge Global Object

**File:** `runtime/fastedge/builtins/fastedge.cpp`
**CMake name:** `fastedge::fastedge`

Provides three sub-objects on the `fastedge` global:

| Object | JS API | Function |
|--------|--------|----------|
| `fastedge.env` | `getEnv(name)` | Read environment variables via host API |
| `fastedge.fs` | `readFileSync(path)` | Read embedded files (INIT_ONLY — runs during Wizer pre-init) |
| `fastedge.secret` | `getSecret(name)` | Read deployment-time secrets via host API |

**Note:** `readFileSync` is marked `INIT_ONLY` — it can only be called during Wizer initialization, not at request time. This is how static assets get embedded into the WASM binary.

### kv-store.cpp — Key-Value Store

**File:** `runtime/fastedge/builtins/kv-store.cpp`
**CMake name:** `fastedge::kv_store`

Provides the `KvStore` class:

| Method | Purpose |
|--------|---------|
| `KvStore.open(name)` | Open a named KV store (static factory) |
| `.get(key)` | Get value by key |
| `.scan(cursor)` | Iterate keys |
| `.zrangeByScore(key, min, max)` | Sorted set range query |
| `.zscan(key, cursor)` | Sorted set scan |
| `.bfExists(key, item)` | Bloom filter membership test |

### console-override.cpp — Console Override

**File:** `runtime/fastedge/builtins/console-override.cpp`
**CMake name:** `fastedge::console_override`

Overrides the default `console` implementation to route logging through the FastEdge host API.

## Host API (C++ → WIT Bridge)

**Location:** `runtime/fastedge/host-api/`

The host API layer bridges C++ builtins to the WIT-defined host imports. When a builtin like `getEnv()` is called, it invokes `host_api::get_env_vars()` which maps to a WIT import that the FastEdge CDN runtime (Wasmtime) fulfills.

**Key files:**
- `fastedge_host_api.cpp` — host API implementation
- `include/fastedge_host_api.h` — C++ header
- `bindings/` — auto-generated WIT bindings (cbindgen)
- `wit/` — local WIT definitions for the host API world
- `src/` — additional host API source

## WIT World Definition

**Location:** `runtime/FastEdge-wit/world.wit`

```wit
package gcore:fastedge;

world reactor {
    import http;
    import http-client;
    import dictionary;
    import secret;
    import key-value;

    export http-handler;
}
```

### Imports (host provides to WASM)

| Interface | WIT File | Purpose |
|-----------|----------|---------|
| `http` | `http.wit` | HTTP request/response types |
| `http-client` | `http-client.wit` | Outbound HTTP requests (`fetch`) |
| `dictionary` | `dictionary.wit` | Environment variable dictionary |
| `secret` | `secret.wit` | Secret retrieval |
| `key-value` | `key-value.wit` | KV store operations |

### Exports (WASM provides to host)

| Interface | WIT File | Purpose |
|-----------|----------|---------|
| `http-handler` | `http-handler.wit` | Handle incoming HTTP requests |

### WIT Generation Scripts

- `runtime/fastedge/scripts/merge-wit-bindings.js` — merges WIT from multiple sources
- `runtime/fastedge/scripts/create-wit-bindings.sh` — generates C bindings from WIT
- Run via: `pnpm run generate:wit-world` (runs merge then bindings)

## Build Process

### Local Build

```sh
# Debug build (faster, larger output)
pnpm run build:monkey:dev
# → runtime/fastedge/build.sh --debug

# Release build
pnpm run build:monkey:prod
# → runtime/fastedge/build.sh
```

### What build.sh Does

1. Sets build type (`Debug` or `Release`)
2. Runs CMake configure: `HOST_API=$(realpath host-api) cmake -B build-{type}`
3. Runs CMake build: `cmake --build build-{type} --parallel 8`
4. Copies outputs:
   - `build-{type}/starling-raw.wasm/starling-raw.wasm` → `lib/fastedge-runtime.wasm`
   - `build-{type}/starling-raw.wasm/preview1-adapter.wasm` → `lib/preview1-adapter.wasm`

### Prerequisites for Runtime Build

| Dependency | Version | Install |
|------------|---------|---------|
| Rust | latest stable | `curl -so rust.sh https://sh.rustup.rs && sh rust.sh -y` |
| wasm32-wasi target | — | `rustup target add wasm32-wasi` |
| wasi-sdk | v20 | Download from GitHub, install to `/opt/wasi-sdk/` |
| binaryen | — | `sudo apt install binaryen` |
| cbindgen | — | `cargo install cbindgen` |
| build-essential | — | `sudo apt install build-essential` |
| CMake | >= 3.27 | Required by CMakeLists.txt |

### Docker Compiler

**Location:** `compiler/`

For CI/CD, a Docker image encapsulates all native build dependencies. See `compiler/README.md` for details.

## Key Directories

| Directory | Contents |
|-----------|----------|
| `runtime/StarlingMonkey/` | SpiderMonkey WASM engine (git submodule) |
| `runtime/fastedge/builtins/` | C++ builtin implementations (3 files) |
| `runtime/fastedge/host-api/` | Host API bridge (C++ → WIT) |
| `runtime/fastedge/host-api/wit/` | Local WIT definitions for host API |
| `runtime/fastedge/scripts/` | WIT binding generation scripts |
| `runtime/fastedge/build-debug/` | Debug build artifacts |
| `runtime/fastedge/build-release/` | Release build artifacts |
| `runtime/FastEdge-wit/` | Top-level WIT world definition |
| `compiler/` | Docker build environment |
