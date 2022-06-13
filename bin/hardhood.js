#!/usr/bin/env node

const pkg = require("../package");
const Hardhood = require("../src/Hardhood");

const [, , cmd, param, ...hardhatCmd] = process.argv;

const options = {};

if ((cmd === "--new" || cmd === "-n") && param.length > 0) {
  options.newKey = param.toUpperCase();
} else if (cmd === "--list" || cmd === "-l") {
  options.list = true;
} else if (cmd === "--delete" && param.length > 0) {
  options.deleteKeys = param.split(",").map((e) => e.toUpperCase());
} else if (cmd === "--reset") {
  options.reset = true;
} else if (
  (cmd === "-u" || cmd === "use") &&
  param.length > 0 &&
  hardhatCmd.length > 0
) {
  options.useKeys = param.split(",").map((e) => e.toUpperCase());
  options.hardhatCmd = hardhatCmd;
}

if (Object.keys(options).length === 0) {
  console.info(`

Welcome to Hardhood v${pkg.version}
A wrapper around hardhat to safely manage encrypted private keys

For help look at
https://github.com/secrez/hardhood#readme

Options:
  -n, --new  [key]            Add a new key for current project
  -u, --use  [keys] [cmd]     Use the listed keys (separated by comma) to run the command
  --delete [keys]             Delete the listed keys
  --reset                     Delete all the keys for the current project
  -l, --list                  List the keys' names for the current project
`);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

async function main() {
  const hardhood = new Hardhood(options);
  try {
    await hardhood.run();
  } catch (e) {
    console.log(e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
