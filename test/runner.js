import path from "path";
import nodeUrl from "url";

import LocalWebServer from "local-web-server";
import puppeteer from "puppeteer";

export const run = async (urlPorts, opts = {}) => {
  const initUrl = `http://localhost:${urlPorts[0][1]}/`;
  const wss = urlPorts.map(([url, port]) => runLWS(url, port));
  const browser = await puppeteer.launch(opts.launch);
  const guard = newGuard();
  try {
    const page = await browser.newPage();
    await page.exposeFunction("finish", guard.finish);
    page.on("error", err => console.error(err));
    page.on("pageerror", err => console.error(err));
    page.on("console", msg => {
      const {url, lineNumber, columnNumber} = msg.location();
      const fmt = `[${url} ${lineNumber}:${columnNumber}]: ${msg.text()}`;
      if (msg.type() === "assert") console.assert(false, fmt);
      else console[msg.type()](fmt);
    });
    const pagePromise = page.goto(initUrl, opts.goto);
    if (opts.timeout > 0) {
      const id = setTimeout(
        guard.error, opts.timeout, `timeout: ${opts.timeout}ms`);
      try {
        await guard.promise;
      } finally {
        clearTimeout(id);
      }
    } else {
      guard.finish();
    }
    await pagePromise;
    if (opts.launch && opts.launch.headless === false) {
      const pageGuard = newGuard();
      page.on("close", pageGuard.finish);
      await pageGuard.promise;
    } else {
      await page.close();
    }
  } finally {
    await browser.close();
    wss.forEach(ws => ws.server.close());
  }
};

export const runLWS = (url, port) => {
  const file = nodeUrl.fileURLToPath(url);
  const directory = file.endsWith(path.sep) ? file : path.dirname(file);
  return LocalWebServer.create({port, directory});
};

const newGuard = () => {
  let r = {};
  r.promise = new Promise((finish, error) => {
    r.finish = finish;
    r.error = error;
  });
  return r;
};
