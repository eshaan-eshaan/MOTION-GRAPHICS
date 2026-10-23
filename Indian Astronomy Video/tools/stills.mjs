// Render QA stills for a composition at several frames with a single bundle.
// Usage: node tools/stills.mjs <CompositionId> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const shortBrowser = path.join(process.env.LOCALAPPDATA ?? os.homedir(), "remotion-chs", "chrome-headless-shell.exe");
const browserExecutable = process.platform === "win32" && fs.existsSync(shortBrowser) ? shortBrowser : null;

const [id, ...frames] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
fs.mkdirSync(path.join(root, "qa"), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts"), publicDir: path.join(root, "public"), rspack: true });
const composition = await selectComposition({ serveUrl, id, browserExecutable, port: 3411 });
for (const f of frames.map(Number)) {
  const output = path.join(root, "qa", `${id}_${String(f).padStart(4, "0")}.jpg`);
  await renderStill({ composition, serveUrl, output, frame: f, imageFormat: "jpeg", jpegQuality: 88, browserExecutable, port: 3411 });
  console.log("wrote", path.relative(root, output));
}
