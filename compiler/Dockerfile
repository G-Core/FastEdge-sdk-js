# Ubuntu Jammy image with latest stable clang release
# clang is installed from nightly builds from official https://apt.llvm.org repo

ARG distro=jammy

FROM ubuntu:${distro}

# Latest stable version so far
ARG DEBIAN_FRONTEND=noninteractive
ARG clang_version=18
ARG distro
ARG rustArch=x86_64-unknown-linux-gnu
ARG rust_version=1.80.0
ARG wasi_target=wasm32-wasip1
ARG cmake_version=3.31.8

ENV RUSTUP_HOME=/usr/local/rustup \
  CARGO_HOME=/usr/local/cargo \
  PATH=/usr/local/cargo/bin:$PATH

RUN \
  apt-get update && apt-get install -y --no-install-recommends \
  gnupg ca-certificates apt-utils python3-pip \
  build-essential dpkg-dev debhelper fakeroot \
  git libelf-dev linux-libc-dev gcc-multilib \
  protobuf-compiler protobuf-compiler-grpc libgrpc++-dev \
  libfmt-dev libspdlog-dev libboost-dev libboost-system-dev libyaml-cpp-dev \
  libprotobuf-dev libsystemd-dev pkg-config ragel libpci-dev curl libnuma-dev \
  libcurl4-openssl-dev \
  python3-paramiko libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Add third-party repositories
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget gpg gpg-agent \
  && wget -qO - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - \
  && echo deb http://apt.llvm.org/${distro}/ llvm-toolchain-${distro}-${clang_version} main > /etc/apt/sources.list.d/llvm.list \
  && echo deb [arch=amd64 trusted=yes] https://pulp.gc.onl/pulp/content/gcdn-nosign-ubuntu/ ${distro} main > /etc/apt/sources.list.d/gcdn.list \
  && apt-get purge --auto-remove -y gpg gpg-agent \
  && rm -rf /var/lib/apt/lists/*

# Install build environment
RUN \
  apt-get update && apt-get install --assume-yes --no-install-recommends \
  clang-${clang_version} lldb-${clang_version} lld-${clang_version} \
  clangd-${clang_version} clang-format-${clang_version} llvm-${clang_version} \
  clang-tidy-${clang_version} clang-tools-${clang_version} \
  && rm -rf /var/lib/apt/lists/*

# Stable releases of clang don't provide binaries without numbers, workaround:
COPY compiler/update_clang_alternatives.sh /tmp/update_clang_alternatives.sh
RUN /tmp/update_clang_alternatives.sh ${clang_version} 100


# Install CMake
RUN \
  wget -q -P /usr/src/cmake https://github.com/Kitware/CMake/releases/download/v${cmake_version}/cmake-${cmake_version}.tar.gz && \
  tar -xzf /usr/src/cmake/cmake-${cmake_version}.tar.gz -C /usr/src/cmake --strip-components=1 && \
  rm /usr/src/cmake/cmake-${cmake_version}.tar.gz && \
  cd /usr/src/cmake && \
  ./bootstrap --prefix=/usr/local --system-curl --system-zlib --system-bzip2 && \
  make -j$(nproc) && \
  make install && \
  cmake --version && \
  rm -rf /usr/src/cmake

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain ${rust_version}; \
  rustup --version; \
  cargo --version; \
  rustc --version;

# Install WASI target
RUN rustup target add ${wasi_target} --toolchain ${rust_version}
