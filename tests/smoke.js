// Headless-Chrome smoke test via raw CDP (no Playwright dependency).
// Usage: node tests/smoke.js <chrome-binary> <file-url> [viewportWidth]
const { spawn } = require("child_process");
const http = require("http");

const BIN = process.argv[2];
const URL = process.argv[3];
const VW = +(process.argv[4] || 390);
const PORT = 9333;

function getJson(path) {
  return new Promise((res, rej) => {
    http.get("http://127.0.0.1:" + PORT + path, (r) => {
      let s = ""; r.on("data", (c) => (s += c)); r.on("end", () => res(JSON.parse(s)));
    }).on("error", rej);
  });
}

async function main() {
  const chrome = spawn(BIN, [
    "--headless=new", "--no-sandbox", "--disable-gpu",
    "--remote-debugging-port=" + PORT, "--window-size=" + VW + ",844", "about:blank",
  ], { stdio: "ignore" });
  const errors = [];
  try {
    let tabs = null;
    for (let i = 0; i < 50 && !tabs; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try { tabs = await getJson("/json/list"); } catch (e) { /* retry */ }
    }
    if (!tabs) throw new Error("CDP did not come up");
    const wsUrl = tabs[0].webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        errors.push(msg.params.exceptionDetails.exception.description || "page exception");
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        errors.push("console.error: " + JSON.stringify(msg.params.args.map(a => a.value)));
      }
    };
    const send = (method, params) => new Promise((res, rej) => {
      const id = ++seq; pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const ev = async (expr) => {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
      if (r.exceptionDetails) throw new Error("eval exception: " + JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };
    await send("Page.enable"); await send("Runtime.enable");
    await send("Page.navigate", { url: URL });
    await new Promise((r) => setTimeout(r, 1500));
    await ev("document.readyState");

    const checks = [];
    const check = (name, cond, extra) => {
      checks.push([name, !!cond, extra]);
      console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : " :: " + extra));
    };

    check("title renders", (await ev("document.title")).includes("বাগধারা"));
    check("48 cards render", (await ev("document.querySelectorAll('#list .card').length")) === 48,
      await ev("document.querySelectorAll('#list .card').length"));
    check("count text shows 48", (await ev("document.getElementById('count').textContent")).includes("৪৮"));
    // Search filter
    await ev("(()=>{const s=document.getElementById('search'); s.value='কুমির'; s.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await new Promise((r) => setTimeout(r, 300));
    check("search 'কুমির' filters to 3", (await ev("document.querySelectorAll('#list .card').length")) === 3,
      await ev("document.querySelectorAll('#list .card').length"));
    await ev("(()=>{const s=document.getElementById('search'); s.value=''; s.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await new Promise((r) => setTimeout(r, 300));
    // Detail opens
    await ev("document.querySelector('#list .card').click()");
    await new Promise((r) => setTimeout(r, 300));
    check("detail panel opens", await ev("document.getElementById('detail').classList.contains('open')"));
    await ev("document.getElementById('closeDetail').click()");
    // Quiz
    await ev("document.getElementById('startQuiz').click()");
    await new Promise((r) => setTimeout(r, 300));
    check("quiz shows 4 options", (await ev("document.querySelectorAll('.opt').length")) === 4,
      await ev("document.querySelectorAll('.opt').length"));
    await ev("document.querySelector('.opt').click()");
    await new Promise((r) => setTimeout(r, 300));
    check("quiz feedback appears", (await ev("document.getElementById('feedback').textContent.length")) > 0);
    check("quiz next button appears", !!(await ev("document.getElementById('nextBtn')")));
    // Language toggle
    await ev("document.getElementById('langBtn').click()");
    await new Promise((r) => setTimeout(r, 300));
    check("EN toggle changes tagline", (await ev("document.getElementById('tagline').textContent")).includes("48 well-known"));
    // No horizontal overflow at mobile width
    check("no horizontal overflow at " + VW + "px",
      (await ev("document.documentElement.scrollWidth")) <= VW,
      await ev("document.documentElement.scrollWidth"));
    check("no page errors", errors.length === 0, errors.join(" | "));

    const failed = checks.filter((c) => !c[1]).length;
    console.log("\n" + (checks.length - failed) + "/" + checks.length + " smoke checks passed");
    ws.close();
    process.exit(failed ? 1 : 0);
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error("SMOKE FAILED: " + e.message); process.exit(1); });
