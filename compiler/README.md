## Compiler Environment

This is the build environment for creating the lib folder contents in CI/CD.

It is essentially all the build tools required for creating the FastEdge runtime wasm.

Tools include things like:

Clang18 / Cmake / Rust / wasm32-wasi toolchain etc..

### Creating the Compiler image (from the rootdir):

```sh
docker build -t harbor.p.gc.onl/fastedge/clang-monkey-compiler:0.0.1 -f ./compiler/Dockerfile .
```

#### Pushing it to Harbor

```sh
docker login https://harbor.p.gc.onl/

docker push harbor.p.gc.onl/fastedge/clang-monkey-compiler:0.0.1
```

## How to use it locally:

### Creating a Build Image (from the rootdir):

This uses the compiler image from above `harbor.p.gc.onl/fastedge/clang-monkey-compiler:0.0.1`

and loads the codebase ready for compiling.

```sh
docker build -t clang-monkey .
```

Then run it to compile the binary files:

- release build

```sh
docker run -v $(pwd)/lib:/usr/src/app/lib clang-monkey
```

- dev build

```sh
docker run -v $(pwd)/lib:/usr/src/app/lib clang-monkey --debug
```
