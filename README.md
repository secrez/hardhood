# Hardhood

A wrapper around hardhat to safely manage encrypted private keys

## Why Hardhood?

Hardhat is a fantastic tool. The problem is that it does not manage private keys. So, users put their keys in git-ignored `.env` files. That is very risky, because if someone changes the .gitignore the private keys can be exposed. Also, despite being in a git-ignored file, those private keys live on the hard drive, in plain text. That sounds terrifying to me.

Hardhood is a simple wrapper around Hardhat that tries to solve the issue.

## Configuration

In the common scenario, you have an `.env` file with private keys. To not change the approach, Hardhood introduces env variables called HARDHOOD_OWNER, HARDHOOD_VALIDATOR, etc. which are generated dynamically and passed to the hardhat-config.js.

So, let's say you have in your `.env` file the private key of Hardhat's accounts[0]:

```
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

You can modify your `hardhat-config.js` file, setting private keys like:

```
    ...
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.HARDHOOD_OWNER || process.env.PRIVATE_KEY],
      chainId: 3
    },
    ...
```

If you now launch it with Hardhat, the env variable PRIVATE_KEY will be used. But, if you launch it with Hardhood, HARDHOOD_OWNER will be used instead.

### Multiple keys

To configure multiple keys, you can set up the config like

```
    ...
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        process.env.HARDHOOD_OWNER || process.env.PRIVATE_KEY,
        process.env.HARDHOOD_VALIDATOR,
        process.env.HARDHOOD_DAO
      ],
      chainId: 3
    },
    ...
```

## Install

For now, only a beta version is available:

```
npm install -g hardhood@0.1.0-beta.1
```

PS. The version 0.1.0 was just a scaffolding. Ignore it.

## Usage

Set up a new private key called owner with

```javascript
hardhood -n owner
```

Notice, that the string `owner` will be uppercased and used for the env variable. In this case, it will generate `HARDHOOD_OWNER`.

Hardhood will ask for the key, then for the password to encrypt it.
Finally it will save the encrypted private key in `~/.hardhood/[name-or-project].json`.

Suppose that you have to launch

```
npx hardhat run scripts/deploy-pool.js --network mainnet
```

You can now launch instead

```
hardhood -u owner run scripts/deploy-pool.js --network mainnet
```

Hardhood will look for the encrypted private key, retrieve it and
ask for the password you used to encrypt it. Then, it runs the hardhat script.

### Multiple keys

If the script requires multiple keys, you can call it like

```
hardhood -u contractOwner,validator,operator run scripts/deploy-pool.js --network mainnet
```

In this case it will expect 3 different passwords for the 3 different private keys. However, if you used the same password for all of them, you can press enter at the second and third request; then, Hardhood will try to use the first password for all the keys.

### Notes

To delete an existing keys, launch something like

```
hardhood -d validator,operator
```

To reset the project and remove all the keys, launch

```
hardhood -r
```

## About security

Hardhood uses the package @secrez/crypto from Secrez https://github.com/secrez/secrez

## Help

If you run hardhood without parameters, an help will be displayed:

```
Welcome to Hardhood v0.1.0-beta.1
A wrapper around hardhat to safely manage encrypted private keys

For help look at
https://github.com/secrez/hardhood#readme

Options:
  -n, --new  [key]            Add a new key for current project
  -u, --use  [keys] [cmd]     Use the listed keys (separated by comma) to run the command
  --delete [keys]             Delete the listed keys
  --reset                     Delete all the keys for the current project
  -l, --list                  List the keys' names for the current project

```

## History

**0.1.0-beta.1**

- Implements a first version working, with some issue showing the output by hardhat

## TODO

- Fix the issues with the log from hardhat
- Add option to make the tool more flexible

## Copyright

(c) 2022 Francesco Sullo <francesco@sullo.co>

## License

MIT
