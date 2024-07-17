# FastEdge JS SDK

This provides a runtime environment for Javascript on the Gcore FastEdge Platform.

## Working with the source code

This repo uses git submodules. So in order to build anything you need to run:

```sh
git submodule update --recursive --init
```

### Tooling Requirements

Software that needs installing to work with this library:

- Rust
  ```
  curl -so rust.sh https://sh.rustup.rs && sh rust.sh -y
  restart shell or run source $HOME/.cargo/env
  ```
- Build tools
  ```sh
  sudo apt install build-essential
  ```
- binaryen
  ```sh
  sudo apt install binaryen
  ```
- rust target wasm32-wasi
  ```sh
  rustup target add wasm32-wasi
  ```
- [cbindgen](https://github.com/eqrion/cbindgen#quick-start)
  ```sh
  cargo install cbindgen
  ```
- [wasi-sdk, version 20](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-20), with
  alternate [install instructions](https://github.com/WebAssembly/wasi-sdk#install)
  ```sh
  curl -sS -L -O https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-20.0-linux.tar.gz
  tar xf wasi-sdk-20.0-linux.tar.gz
  sudo mkdir -p /opt/wasi-sdk
  sudo mv wasi-sdk-20.0/* /opt/wasi-sdk/
  ```

### Building

```sh
npm run build:dev
```

## Testing

Coming soon......
