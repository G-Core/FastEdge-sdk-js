FROM viridiscomms/fastedge:latest

WORKDIR /usr/src/app

COPY . .

ENTRYPOINT ["./runtime/fastedge/build.sh"]
