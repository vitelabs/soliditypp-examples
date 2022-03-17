import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test cross lang features', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
  });

  it('test Strings.sol contract', async () => {
    // compile
    const compiledContracts = await vite.compile('cross_lang/Strings.sol');
    expect(compiledContracts).to.have.property('Strings');
  });

  it('test Test.solpp contract', async () => {
    // compile
    const compiledContracts = await vite.compile('cross_lang/Test.solpp');
    expect(compiledContracts).to.have.property('Test');
    let test = compiledContracts.Test;

    // deploy
    test.setDeployer(deployer).setProvider(provider);
    await test.deploy({});
    expect(test.address).to.be.a('string');

    // toString
    expect(await test.query('toString', ['12345'])).to.be.deep.equal(['12345']);

    // toHexString
    expect(await test.query('toHexString', ['12345'])).to.be.deep.equal(['0x3039']);
  });
});