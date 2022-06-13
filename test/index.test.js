const { assert } = require("chai");
const path = require("path");
const fs = require("fs-extra");
let requireOrMock;

describe("require-or-mock", async function () {
  before(async function () {
    const configSample = await fs.readFile(
      path.resolve(__dirname, "fixtures/require-or-mock-config.js"),
      "utf8"
    );
    await fs.writeFile(
      path.join(process.cwd(), "require-or-mock-config.js"),
      configSample
    );
    requireOrMock = require("..");
  });

  beforeEach(async function () {
    await fs.emptyDir(path.resolve(__dirname, "../tmp"));
  });

  after(async function () {
    await fs.unlink(path.join(process.cwd(), "require-or-mock-config.js"));
    await fs.emptyDir(path.resolve(__dirname, "../tmp"));
  });

  describe("Load module", async function () {
    let { requireModule, requirePath } = require("..");

    it("should return the existing module", async function () {
      const SomeModule = requireOrMock("test/someModule.js");
      const someModule = new SomeModule();
      assert.equal(someModule.hello("Francesco"), "Hello Francesco");
    });

    it("should return a mock from the config file", async function () {
      const someMissingModule = requireOrMock("lib/someMissingModule.js");
      assert.equal(someMissingModule.hello("Francesco"), "Hello");
    });

    it("should return a mock from a passed value using requireModule", async function () {
      const someOtherMissingModule = requireModule(
        "lib/someOtherMissingModule.js",
        {
          hello: "Ciao",
        }
      );
      assert.equal(someOtherMissingModule.hello, "Ciao");
    });

    it("should return an empty object if not value passed", async function () {
      const someOtherMissingModule = requireOrMock(
        "lib/someOtherMissingModule.js"
      );
      assert.equal(Object.keys(someOtherMissingModule).length, 0);
    });

    it("should return an empty array if specified as mock", async function () {
      const someOtherMissingModule = requireOrMock(
        "lib/someOtherMissingModule.js",
        []
      );
      assert.equal(someOtherMissingModule.length, 0);
    });

    it("should throw if wrong format for content is passed", async function () {
      try {
        requireOrMock("lib/someOtherMissingModule.js", 33);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.message, "Wrong mock format passed");
      }

      try {
        requireModule("lib/someOtherMissingModule.js", 33);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.message, "Wrong mock format passed");
      }

      try {
        requirePath("lib/someOtherMissingModule.js", 33);
        assert.isTrue(false);
      } catch (e) {
        assert.equal(e.message, "Wrong mock format passed");
      }
    });
  });

  describe("Create missing module", async function () {
    let { requirePath } = require("..");

    it("should create a missing but needed JSON file", async function () {
      const someJSON = {
        nick: "gero",
      };

      const some = require(requireOrMock("tmp/someJSON.json", true, someJSON));
      assert.equal(some.nick, "gero");
    });

    it("should create a missing but needed JSON file with different order or params", async function () {
      const someJSON = {
        nick: "gero",
      };

      const some = require(requireOrMock("tmp/someJSON.json", someJSON, true));
      assert.equal(some.nick, "gero");
    });

    it("should create a missing, empty JSON file", async function () {
      const some = require(requireOrMock("tmp/someJSON2.json", true));
      assert.equal(Object.keys(some).length, 0);
    });

    it("should create a missing, empty JSON file using requirePath", async function () {
      const some = require(requirePath("tmp/someJSON2.json"));
      assert.equal(Object.keys(some).length, 0);
    });

    it("should create a missing but needed JS module", async function () {
      const someJS = `module.exports = {
        hello: n => 'hello '+ n
      }`;

      requireOrMock("tmp/some/module.js", true, someJS);
      // eslint-disable-next-line
      const some = require("../tmp/some/module");
      assert.equal(some.hello("Francesco"), "hello Francesco");
    });

    it("should create a missing but needed JS module", async function () {
      const someJS = `module.exports = {
        hello: n => 'hello '+ n
      }`;

      // we create it
      requireOrMock("tmp/someJS.js", true, someJS);
      // the mock file exists
      const some = require(requireOrMock("tmp/someJS.js", true, someJS));
      assert.equal(some.hello("Francesco"), "hello Francesco");
    });

    it("should create a missing but needed JS module defined in the config", async function () {
      const some = require(requireOrMock("tmp/anotherMissingModule.js", true));
      assert.equal(some.number, 12);
    });
  });
});
