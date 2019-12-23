# put-ipfs 

A module for browsers to publish files as a bundle with IPFS node.

## Requirements

This module requires ECMAScript2019(`async`, `await`) and 
standard Web APIs(`fetch`, `crypto`) on browser environments.

You can directly import source js module files, no bundle/transpile process required.

## Example

```js
import "https://cdn.jsdelivr.net/npm/ipfs/dist/index.js";

// 1. import `put` function from this module
import {put} "./modules/put-ipfs.js";

// 2. Use in async function
(async () => {
  // 3. Prepare a IPFS node with `relay` for publishing
  const node = new Ipfs({
    relay: {enabled: true, active: true},
  });
  await node.ready;
  
  // 4. Build a single bundle object from publising files
  //    - key: relative path file name
  //    - value: data as string/ArrayBuffer/TypedArrays
  const bundle = {
    "index.html": `<!doctype html>
<html>
  <head>
    <script type="module" src="./scripts/main.js></script>
  </head>
  <body></body>
</html>`,
    "scripts/main.js": `document.body.append("Hello World");`,
  };
  
  // 5. Call `put` with `await` for result URL string of the published bundle
  const options = {
    gateway: "https://gateway.ipfs.io/ipfs",
  };
  const url = await put(node, bundle, options);

  console.assert(url.startsWith(options.gateway), url);
})().catch(console.error);
```

## API

- `url = await put(ipfsNode, bundle, options={})`
     - `url`: IPFS gateway URL of bundle 
     - `ipfsNode`: a Ipfs object by js-ipfs 
     - `bundle`: a flat key-value object
         - key: relative path from returned bundle URL as `string`
         - value: data as `string`/`ArrayBuffer`/Typed Arrays(`Uint8Array` and so on)
     - `options`: set option
         - `getRandomValues`: randon value generator for `u8a = getRandomValue(new Uint8Array(32))` (default: `window.crypto.getRandomValue.bind(window.crypto)`)
         - `gateway`: IPFS gateway prefix string for returned url (default: `"https://gateway.ipfs.io/ipfs"`)
         - `checkReached`: `fetch` each bundle data with IPFS gateway URLs when `true`
         - `fetchImpl`: `fetch` function for `response = await fetch(url, {method: "HEAD"})` (default: `window.fetch`)

NOTE: `put` function uses IPFS MFS feature(`node.files`). 
`put` function prepares `/tmp/${HEX_OF_RANDOM_VALUES}/...` to publish in IPFS MFS.
This temporal path is removed from IPFS MFS after published.

## Requirement for module tests

Module implementation tests are written with ES module and used `local-web-server` and `puppeteer` package in node.js.

- node.js >= 13.2 is required for test runners.

```shell
$ npm i
$ node test/put-html/run.js
(node:28619) ExperimentalWarning: The ESM module loader is experimental.
[http://localhost:9000/main.js 5:10]: [INFO] IPFS node spawn several logs includes WebSocket Errors
...(many outputs from js-ipfs code)
[http://localhost:9000/main.js 32:10]: [published url] https://gateway.ipfs.io/ipfs/QmYED3fV7SS4LRUnWteL6yE4TDynoFjJDN6Qw4fTcSABLc/
$ 
```

A bundle url is displayed when success. (Success or timeout is depend on IPFS network conditions).
