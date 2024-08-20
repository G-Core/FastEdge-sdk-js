#!/usr/bin/env bash
# Change the current working directory to the directory of the script
cd "$(dirname "$0")" || exit 1

# Default build type
BUILD_TYPE=Release

# Check for --debug option
for arg in "$@"
do
    if [ "$arg" == "--debug" ]
    then
        BUILD_TYPE=Debug
        break
    fi
done

BUILD_PATH=build-${BUILD_TYPE,,}

# Configure the build environment using cmake
# HOST_API=$(realpath host-api) cmake -B build-debug -DCMAKE_BUILD_TYPE=Debug
HOST_API=$(realpath host-api) cmake -B $BUILD_PATH -DCMAKE_BUILD_TYPE=$BUILD_TYPE
# cmake -B $BUILD_PATH -DCMAKE_BUILD_TYPE=$BUILD_TYPE -DENABLE_BUILTIN_WEB_FETCH=0 -DENABLE_BUILTIN_WEB_FETCH_FETCH_EVENT=0
# cmake -B $BUILD_PATH -DCMAKE_BUILD_TYPE=$BUILD_TYPE -DENABLE_BUILTIN_WEB_FETCH=0
# Build the StarlingMonkey runtime
# cmake --build $BUILD_PATH --parallel 16
cmake --build $BUILD_PATH --parallel 8
# Copy the built WebAssembly module to the parent directory
mv $BUILD_PATH/starling.wasm/starling.wasm ../../lib/fastedge-runtime.wasm
mv $BUILD_PATH/starling.wasm/preview1-adapter.wasm ../../lib/preview1-adapter.wasm
