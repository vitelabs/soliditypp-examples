import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');

let provider: any;

describe("smoke test", () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
  });

  it("checking height", async () => {

    for (let i = 0; i < 5; i++) {
      vite.mint(provider);
      let h = await vite.getSnapshotHeight(provider);
      console.log('snapshot height:', h);
      await vite.utils.sleep(1000);
    }
  });
});
