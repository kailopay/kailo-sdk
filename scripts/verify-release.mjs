import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const tagName = process.env.GITHUB_REF_NAME;

if (tagName === undefined) {
  throw new Error("GITHUB_REF_NAME is required when verifying a release");
}

const expectedTag = `v${packageJson.version}`;
if (tagName !== expectedTag) {
  throw new Error(`release tag ${tagName} does not match package version ${expectedTag}`);
}

console.log(`verified ${packageJson.name}@${packageJson.version} for tag ${tagName}`);
