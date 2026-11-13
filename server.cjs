// Optional local preview server. The deployed app itself is entirely static.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".md": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  let file;
  try { const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname); file = path.resolve(root, "." + (relative === "/" ? "/index.html" : relative)); } catch { res.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep) || file.split(path.sep).some(part => part.startsWith("."))) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end("Not found"); return; } res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(req.method === "HEAD" ? undefined : data); });
}).listen(Number(process.env.PORT || 4173), "127.0.0.1", () => console.log("Bleep Studio: http://127.0.0.1:" + (process.env.PORT || 4173)));
