module.exports = {
  "lib/someMissingModule.js": {
    hello: () => "Hello",
  },
  "tmp/anotherMissingModule.js": `module.exports = {number: 12}`,
};
