import * as runner from "../runner.js";

runner.run([
  [import.meta.url, 9000],
], {
  launch: {
    //headless: false, appMode: true, devtools: true,
    //args: ["--disable-web-security"],
  }, 
  goto: {
    waitUntil: "networkidle0",
    //timeout: 300 * 1000, 
  },
  timeout: 300 * 1000,
}).catch(console.error);

/*
const path = require("path");

const LocalWebServer = require("local-web-server");
const puppeteer = require("puppeteer");

const port = 9000;
const ws = LocalWebServer.create({port, directory: __dirname,});

const timeout = 300 * 1000;
const finish = () => {
  let r = {};
  r.promise = new Promise((finish, error) => {
    r.finish = finish;
    r.error = error;
  });
  return r;
};

(async () => {
  const browser = await puppeteer.launch({
    //headless: false, appMode: true, devtools: true,
    //args: ["--disable-web-security"],
  });
  try {
    const page = await browser.newPage();
    page.on("error", err => console.error(err));
    page.on("pageerror", err => console.error(err));
    page.on("console", msg => {
      const {url, lineNumber, columnNumber} = msg.location();
      const fmt = `[${url} ${lineNumber}:${columnNumber}]: ${msg.text()}`;
      if (msg.type() === "assert") console.assert(false, fmt);
      else console[msg.type()](fmt);
    });
    const finished = finish();
    await page.exposeFunction("finish", finished.finish);
    const promise = page.goto(
      `http://localhost:${port}`, {waitUntil: "networkidle0", timeout: timeout});
    setTimeout(finished.error, timeout, `timeout: ${timeout}ms`);
    await Promise.race([promise, finished.promise]);
    await page.close();
  } finally {
    await browser.close();
    ws.server.close();
  }
  process.exit(0);
})().catch(console.error);
//*/
