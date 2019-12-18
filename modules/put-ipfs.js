
// option defaults
const gateway = options => {
  return options.gateway || "https://gateway.ipfs.io/ipfs";
};
const fetchImpl = options => {
  return typeof options.fetch === "function" ? options.fetch : fetch;
};
const getRandomValues = options => {
  return typeof options.getRandomValues === "function" ?
    options.getRandomValues : crypto.getRandomValues.bind(crypto);
};
const trial = options => {
  return Number.isInteger(options.trial) ?
    Math.max(1, Math.min(options.trial, 10)) : 10;
};
const checkReached = options => Boolean(options.checkReached);
const noPin = options => Boolean(options.noPin);
const waitWithGet = options => Boolean(options.waitWithGet);

// put bundle
export const put = async (node, bundle, options = {}) => {
  // bundle as: {"index.html": "<body>Hello</body>", [path1]: data1, ...}
  await node.ready;
  const tmp = await tmpRoot(node, options);
  try {
    const {Buffer} = node.constructor;
    for (const [path, content] of Object.entries(bundle)) {
      if (!path) continue;
      await node.files.write(
        `${tmp}${path}`, Buffer.from(content), {create: true, parents: true});
    }
    await node.files.flush(tmp);
    const root = await node.files.stat(tmp);
    const base = `${gateway(options)}/${root.hash}/`;
    if (!noPin(options)) {
      const pinset = await node.pin.add(root.hash);
      //console.debug("pinset:", pinset);
    }
    if (checkReached(options)) {
      //console.debug("await reached to gateway:", base);
      await waitAccessible(base, Object.keys(bundle), options);
    }
    return base;
  } finally {
    await cleanupMFS(node, tmp);
  }
};

const tmpRoot = async  (node, options) => {
  while (true) {
    const randValue = getRandomValues(options)(new Uint8Array(32));
    const tmpName = "".concat(
      ...Array.from(randValue, u8 => u8.toString(16).padStart(2, "0")));
    const tmp = `/tmp/${tmpName}/`;
    try {
      const stat = await node.files.stat(tmp);
      // existed: retry
      continue;
    } catch (error) {
      // not existed: use it
      return tmp;
    }
  }
};

const cleanupMFS = async (node, root) => {
  await node.files.rm(root, {recursive: true});
};

export const waitAccessible = async (base, pathList, options = {}) => {
  outer: for (const path of pathList) {
    const url = `${base}${path}`;
    let timeout = 100;
    for (let count = 0; count < trial(options); count++) {
      try {
        await new Promise(f => setTimeout(f, timeout * (1 + Math.random())));
        timeout *= 2;
        //console.debug("await to fetch:", url);
        const method = waitWithGet(options) ? "GET" : "HEAD";
        const res = await fetchImpl(options)(url, {method});
        if (res.ok) {
          if (waitWithGet(options)) await res.blob();
          continue outer;
        }
        //console.debug(`status of fetch ${url}:`, res.status);
      } catch (error) {
        //console.debug(`error when fetch ${url}:`, error);
      }
    }
  }
};
