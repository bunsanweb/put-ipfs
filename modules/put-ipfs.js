
// option defaults
const gateway = options => {
  return options.gateway || "https://gateway.ipfs.io/ipfs";
};
const fetchImpl = options => {
  return typeof options.fetch === "function" ? options.fetch : fetch;
};
const trial = options => {
  return Number.isInteger(options.trial) ?
    Math.max(1, Math.min(options.trial, 10)) : 10;
};
const checkReached = options => Boolean(options.checkReached);
const noPin = options => Boolean(options.noPin);


// put bundle
export const put = async (node, bundle, options = {}) => {
  // bundle as: {"index.html": "<body>Hello</body>", [path1]: data1, ...}
  await node.ready;
  await cleanupMFS(node);
  try {
    const {Buffer} = node.constructor;
    for (const [path, content] of Object.entries(bundle)) {
      if (!path) continue;
      await node.files.write(
        `/${path}`, Buffer.from(content), {create: true});
    }
    await node.files.flush("/");
    const root = await node.files.stat("/");
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
    await cleanupMFS(node);    
  }
};

const cleanupMFS = async node => {
  for (const {name} of await node.files.ls("/")) {
    await node.files.rm(`/${name}`, {recursive: true});
  }
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
        const res = await fetchImpl(options)(url, {method: "HEAD"});
        if (res.ok) continue outer;
        //console.debug(`status of fetch ${url}:`, res.status);
      } catch (error) {
        //console.debug(`error when fetch ${url}:`, error);
      }
    }
  }
};
