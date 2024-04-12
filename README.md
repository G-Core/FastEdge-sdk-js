# FastEdge JS SDK

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/G-Core/FastEdge-sdk-js/deploy.yaml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/t/G-Core/FastEdge-sdk-js)
![GitHub top language](https://img.shields.io/github/languages/top/G-Core/FastEdge-sdk-js)
![GitHub License](https://img.shields.io/github/license/G-Core/FastEdge-sdk-js)
![NPM Version](https://img.shields.io/npm/v/@gcoredev/fastedge-sdk-js)

This is the Javascript SDK for building Javascript applications ready for deploying on FastEdge.

## Table of Contents

- [FastEdge JS SDK](#fastedge-js-sdk)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
    - [Basic Javascript Example](#basic-javascript-example)
  - [Home Page](#home-page)

## Getting Started

Please read through the documentation provided by Gcore.

- FastEdge: [Overview](https://gcore.com/fastedge)
- User Guide: [Homepage](https://G-Core.github.io/FastEdge-sdk-js/)
- Deploying an App:
  [Documentation](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)

## Installation

Required:

- Node v18 or higher

Setup:

- `npm install --save-dev @gcoredev/fastedge-sdk-js`

### Basic Javascript Example

```js
async function app(event) {
  const request = event.request;
  return new Response(`You made a request to ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
```

## Home Page

For more information on how this works please visit our user guide and
[homepage](https://G-Core.github.io/FastEdge-sdk-js/)
