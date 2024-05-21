FROM ubuntu:jammy
ARG llvmver=18

# Pre-Req Repos
RUN apt-get update \
 && apt-get install -y \
  software-properties-common \
  gnupg \
# Needed for repo access
  apt-transport-https \
  ca-certificates

ADD compiler/llvm.list /etc/apt/sources.list.d/
ADD compiler/llvm-snapshot.gpg.key.gpg /etc/apt/trusted.gpg.d/

# Install pre-reqs
RUN apt-get update \
 && apt-get install -y \
  ca-certificates \
  build-essential \
  wget \
  curl \
# Install Tool
  clang-$llvmver \
  clang-tools-$llvmver \
  clang-format-$llvmver \
  python3-clang-$llvmver \
  libfuzzer-$llvmver-dev \
  lldb-$llvmver \
  lld-$llvmver \
  libc++-$llvmver-dev \
  libc++abi-$llvmver-dev \
  libomp-$llvmver-dev \
  libunwind-$llvmver-dev \
  libpolly-$llvmver-dev \
  libclc-$llvmver-dev \
  # MLIR
  libmlir-15-dev mlir-15-tools \
  # Bolt
  # Doesn't work on aarch64 libbolt-$llvmver-dev bolt-$llvmver \
  # LLVM WASM
  libclang-rt-$llvmver-dev-wasm32 \
  libclang-rt-$llvmver-dev-wasm64 \
  libc++-$llvmver-dev-wasm32 \
  libc++abi-$llvmver-dev-wasm32 \
  libclang-rt-$llvmver-dev-wasm32 \
  libclang-rt-$llvmver-dev-wasm64 \
 # Make an alias for the versioned executable
 && ln -s /usr/bin/clang++-$llvmver /usr/bin/clang++ \
 && ln -s /usr/bin/clang-$llvmver /usr/bin/clang

# Set clang as default C++ version
RUN update-alternatives --install /usr/bin/cc cc /usr/bin/clang 60 \
 && update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++ 60


RUN apt install git -y

# Install CMake
RUN apt update && \
 apt install -y software-properties-common lsb-release && \
 apt clean all

RUN wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null

RUN apt-add-repository "deb https://apt.kitware.com/ubuntu/ $(lsb_release -cs) main"

RUN apt update && \
 apt install kitware-archive-keyring && \
 rm /etc/apt/trusted.gpg.d/kitware.gpg

RUN apt update && \
  apt install cmake -y

# Install Rust
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y

# Add .cargo/bin to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

RUN rustup install 1.68.2

# Install WASI target
RUN rustup target add --toolchain 1.68.2 wasm32-wasi

