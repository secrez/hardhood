const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const homedir = require("homedir");
const Crypto = require("@secrez/crypto");
const { spawn } = require("child_process");

class Hardhood {
  constructor(options) {
    this.options = options;
    this.container = `${homedir()}/.hardhood`;
  }

  async run() {
    await this.init();
    const { newKey, useKeys, deleteKeys, reset, list } = this.options;
    if (newKey) {
      return this.newKey();
    } else if (useKeys) {
      return this.useKeys();
    } else if (list) {
      return this.list();
    } else if (deleteKeys) {
      return this.deleteKeys();
    } else if (reset) {
      return this.reset();
    } else {
      console.error("Unknown option.");
    }
  }

  async deleteKeys() {
    for (let key of this.options.deleteKeys) {
      delete this.store.keys[key];
    }
    await this.saveStore();
    console.info("Keys removed");
  }

  async list() {
    console.info("Active env variables:");
    for (let key in this.store.keys) {
      console.info(`process.env.HARDHOOD_${key}`);
    }
  }

  async reset() {
    this.store = {
      keys: {},
    };
    await this.saveStore();
    console.info("Store reset");
  }

  async newKey() {
    let { privateKey } = await inquirer.prompt([
      {
        type: "password",
        name: "privateKey",
        message: "Paste your private key",
        validate(value) {
          if (/^(0x|)[a-f0-9]{64}$/.test(value)) {
            return true;
          } else {
            return "Please enter a valid private key or press Ctrl-c to cancel";
          }
        },
      },
    ]);
    privateKey = privateKey.replace(/^0x/, "");
    let password;
    await inquirer.prompt([
      {
        type: "password",
        name: "password1",
        mask: "*",
        message: "Type a password >= 8",
        validate(value) {
          if (value.length >= 8) {
            password = value;
            return true;
          } else {
            return "Password must be at lease 8 chars";
          }
        },
      },
      {
        type: "password",
        name: "password2",
        mask: "*",
        message: "Re-type the password",
        validate(value) {
          if (value === password) {
            return true;
          } else {
            return "The two password do not match. Try again or press Ctrl-c to cancel";
          }
        },
      },
    ]);
    this.store.keys[this.options.newKey] = Crypto.encrypt(
      privateKey,
      Crypto.SHA3(password)
    );
    await this.saveStore();
    console.info("Keys successfully stored");
  }

  async useKeys() {
    let previousPassword;
    for (let key of this.options.useKeys) {
      if (!this.store.keys[key]) {
        throw new Error("Encrypted key not found for", key);
      }
      let { password } = await inquirer.prompt([
        {
          type: "password",
          name: "password",
          mask: "*",
          message: "Type the password for " + key,
        },
      ]);
      if (!password && previousPassword) {
        password = previousPassword;
      }
      if (!password) {
        throw new Error("Missing password");
      }
      previousPassword = password;
      process.env[`HARDHOOD_${key}`] = Crypto.decrypt(
        this.store.keys[key],
        Crypto.SHA3(password)
      );
    }
    await this.executeCommand();
  }

  async executeCommand() {
    const args = ["hardhat"].concat(this.options.hardhatCmd);
    const run = spawn("npx", args, {
      env: process.env,
      stdio: "inherit",
      shell: true,
    });
    // run.stdout.on("data", function (data) {
    //   console.debug("stdout: " + data.toString());
    // });
    run.stderr.on("data", function (data) {
      console.error("stderr: " + data.toString());
    });
    run.on("close", (code, signal) => {
      console.debug(
        `child process terminated due to receipt of signal ${signal}`
      );
    });
  }

  async init() {
    const currentDir = process.cwd();
    // first, check if this is a properly configured hardhat project
    const configPath = path.join(currentDir, "hardhat.config.js");

    if (!(await fs.pathExists(configPath))) {
      console.info("Error: no Hardhat found in this folder");
      process.exit(1);
    }
    // else {
    //   const config = await fs.readFile(configPath, "utf8");
    //   if (!/HARDHOOD_/.test(config)) {
    //     console.info("This project does not look configured to use Hardhood");
    //     process.exit(1);
    //   }
    // }
    // we are ready to create the file, if it does not exist
    this.project = path.basename(currentDir);
    await this.readStore();
  }

  async readStore() {
    this.storeFile = path.join(this.container, `${this.project}.json`);
    if (await fs.pathExists(this.storeFile)) {
      this.store = JSON.parse(await fs.readFile(this.storeFile, "utf8"));
    } else {
      this.store = {
        keys: {},
      };
      await this.saveStore();
    }
  }

  async saveStore() {
    await fs.ensureDir(this.container);
    await fs.writeFile(this.storeFile, JSON.stringify(this.store));
  }
}

module.exports = Hardhood;
