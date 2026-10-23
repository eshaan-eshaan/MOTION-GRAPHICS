/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// This project lives in a deeply nested folder; the bundled headless Chrome path would
// exceed Windows' 260-character limit. Use a copy at a short path when it exists
// (see README: "Rendering on Windows").
const shortBrowser = path.join(
  process.env.LOCALAPPDATA ?? os.homedir(),
  "remotion-chs",
  "chrome-headless-shell.exe",
);
if (process.platform === "win32" && fs.existsSync(shortBrowser)) {
  Config.setBrowserExecutable(shortBrowser);
}
