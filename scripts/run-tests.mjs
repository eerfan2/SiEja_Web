import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const testFiles = readdirSync("tests");
const suites = [
  [process.execPath, ["--import", "tsx", "--test", ...testFiles.filter((file) => file.endsWith(".test.ts")).map((file) => `tests/${file}`)]],
  [process.execPath, ["--test", ...testFiles.filter((file) => file.endsWith(".test.mjs")).map((file) => `tests/${file}`)]],
];

for (const [command, args] of suites) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}
