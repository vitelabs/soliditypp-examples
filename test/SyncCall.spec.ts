import { describe } from "mocha";
import { expect } from "chai";
import * as compiler from "../src/compiler";
import * as vite from "../src/vite";
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test SyncCall', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
    console.log('deployer', deployer.address);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('SyncCall.solpp');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');
    expect(compiledContracts).to.have.property('C');

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    // deploy B
    let b = compiledContracts.B;
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({
      params: [a.address!]
    });
    expect(b.address).to.be.a('string');
    console.log(b.address);

    // deploy C
    let c = compiledContracts.C;
    c.setDeployer(deployer).setProvider(provider);
    await c.deploy({
      params: [a.address!, b.address!]
    });
    expect(c.address).to.be.a('string');
    console.log(c.address);

    // call C.f(1);
    await c.call('f', ['1'], {});

    // check value of c
    let result = await c.query('c', []);
    console.log('return', result);
    expect(result).to.be.an('array').with.lengthOf(1);
    expect(result![0]).to.be.equal('1111');
  });
});