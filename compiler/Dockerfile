# Ubuntu Jammy image with latest stable clang release
# clang is installed from nightly builds from official https://apt.llvm.org repo

ARG distro=jammy

FROM ubuntu:${distro}

# Latest stable version so far
ARG DEBIAN_FRONTEND=noninteractive
ARG clang_version=18
ARG distro
ARG rustArch=x86_64-unknown-linux-gnu

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
  python3-paramiko libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Add third-party repositories
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget gpg gpg-agent \
  && wget -qO - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - \
  && wget -qO - https://apt.kitware.com/keys/kitware-archive-latest.asc | apt-key add - \
  && echo deb http://apt.llvm.org/${distro}/ llvm-toolchain-${distro}-${clang_version} main > /etc/apt/sources.list.d/llvm.list \
  && echo deb https://apt.kitware.com/ubuntu/ ${distro} main > /etc/apt/sources.list.d/kitware.list \
  && echo deb [arch=amd64 trusted=yes] https://pulp.gc.onl/pulp/content/gcdn-nosign-ubuntu/ ${distro} main > /etc/apt/sources.list.d/gcdn.list \
  && apt-get purge --auto-remove -y gpg gpg-agent \
  && rm -rf /var/lib/apt/lists/*

# Install build environment
RUN \
  apt-get update && apt-get install --assume-yes --no-install-recommends \
  clang-${clang_version} lldb-${clang_version} lld-${clang_version} \
  clangd-${clang_version} clang-format-${clang_version} llvm-${clang_version} \
  clang-tidy-${clang_version} clang-tools-${clang_version} \
  kitware-archive-keyring cmake \
  && rm -rf /var/lib/apt/lists/*

# Stable releases of clang don't provide binaries without numbers, workaround:
COPY compiler/update_clang_alternatives.sh /tmp/update_clang_alternatives.sh
RUN /tmp/update_clang_alternatives.sh ${clang_version} 100

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.68.2; \
  rustup --version; \
  cargo --version; \
  rustc --version;

# Install WASI target
RUN rustup target add --toolchain 1.68.2 wasm32-wasi
