---
title: Static Website
description: How to compile a static-website into a wasm using FastEdge-sdk-js
---

Following on from "Building with config", if you have not read this please do so now.

### fastedge-init

```sh
npx fastedge-init
```

This command does offer some other options apart from just building "HTTP event-handlers"

#### Static Website

![Description of image](/FastEdge-sdk-js/fastedge-init-static.png)

Following these prompts you will be asked:

1. Provide the `output` file, i.e. where you want the wasm saved.

2. Provide the `public` directory. For most static built sites this is your build folder. e.g.
   Create React App (CRA) this is your `./build` folder. For an Astro site this is your `./dist`
   folder etc..

3. Is your site a SPA? i.e. for unknown routes do you need a fallback page to serve. For
   `create-react-app` this would be `./index.html`

These questions will help you to build out the required config files within the `./fastedge` folder
created within your project.

If you inspect `./fastedge/build-config.js` you will see the generated code, which you can alter to
fine tune your build.

#### Building

Now you can build your static website into a wasm.

```sh
npx fastedge-build --config
```

During this build process FastEdge-sdk-js reads in all your project files and inlines them in memory
before snapshotting this state into your binary.

Thus allowing your applications loaded on our edge servers to have near instant access to the
content you created.
