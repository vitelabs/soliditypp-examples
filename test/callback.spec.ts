import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test callback', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
  });

  it('test callback', async () => {
    // compile
    const compiledContracts = await vite.compile('callback.solpp');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');

    // deploy A
    const A = compiledContracts.A;
    A.setDeployer(deployer).setProvider(provider);
    await A.deploy({});
    expect(A.address).to.be.a('string');

    // deploy B
    const B = compiledContracts.B;
    B.setDeployer(deployer).setProvider(provider);
    await B.deploy({
      params: [A.address!]
    });
    expect(B.address).to.be.a('string');
    console.log(B.address)

    // call B.test();
    await B.call('test', [], {});

    await B.waitForHeight(3);

    // check B.data
    expect(await B.query('data', [])).to.be.deep.equal(['3']);
  });
});