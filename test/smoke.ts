import { describe } from "mocha";
import { expect } from "chai";

import * as vite from "../src/vite";
import * as utils from "../src/utils"

let provider: any;

describe("smoke test", () => {
  before(async function() {
    provider = vite.localProvider();
  });

  it("checking height", async () => {

    for (let i = 0; i < 5; i++) {
      vite.mint(provider);
      let h = await vite.getSnapshotHeight(provider);
      console.log('snapshot height:', h);
      await utils.sleep(1000);
    }
  });
});
