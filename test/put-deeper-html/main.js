import * as PutIpfs from "./modules/put-ipfs.js";
import "https://cdn.jsdelivr.net/npm/ipfs/dist/index.js";
//console.log(window.Ipfs);

const main = async () => {
  console.log("[INFO] IPFS node spawn several logs includes WebSocket Errors");
  const node = new Ipfs({
    repo: `ipfs-${Math.random()}`,
    relay: {enabled: true, hop: {enabled: true, active: true}},
  });
  await node.ready;
  window.ipfsNode = node;
  //console.log("IPFS version:", (await node.version()).version);
  //console.log(`Peer ID:`, (await node.id()).id);

  const bundle = {
    "index.html": `
<html>
<head>
<script type="module" src="./modules/main.js"></script>
</head>
<body>
</body>
</html>`,
    "modules/main.js": `document.body.append("Hello World");`,
  };
  const url = await PutIpfs.put(node, bundle, {
    checkReached: true,
    //noPin: true,
    waitWithGet: true,
  });
  
  console.log("[published url]", url);
  
  if (typeof window.finish === "function") window.finish();
};
main().catch(err => console.error(err.message));
