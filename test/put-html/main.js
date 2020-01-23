import * as PutIpfs from "http://localhost:10000/put-ipfs.js";
import "https://cdn.jsdelivr.net/npm/ipfs/dist/index.js";
//console.debug(window.Ipfs);

const main = async () => {
  console.info("[INFO] IPFS node spawn several logs includes WebSocket Errors");
  const node = new Ipfs({
    repo: `ipfs-${Math.random()}`,
    relay: {enabled: true, hop: {enabled: true, active: true}},
  });
  await node.ready;
  window.ipfsNode = node;
  //console.debug("IPFS version:", (await node.version()).version);
  //console.debug(`Peer ID:`, (await node.id()).id);

  const bundle = {
    "index.html": `
<html>
<head>
<script type="module" src="./main.js"></script>
</head>
<body>
</body>
</html>`,
    "main.js": `document.body.append("Hello World");`,
  };
  const url = await PutIpfs.put(node, bundle, {
    checkReached: true,
    //noPin: true,
    waitWithGet: true,
  });
  
  console.info("[published url]", url);
  
  if (typeof window.finish === "function") window.finish();
};
main().catch(err => console.error(err.message));
