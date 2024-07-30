FROM harbor.p.gc.onl/fastedge/clang-monkey-compiler:0.0.1

WORKDIR /usr/src/app

COPY . .

ENTRYPOINT ["./runtime/fastedge/build.sh"]
