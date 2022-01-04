import { describe } from "mocha";
import { expect } from "chai";
import * as compiler from "../src/compiler";
import * as vite from "../src/vite";
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test cross lang features', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
  });

  it('test Strings.sol contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('cross_lang/Strings.sol');
    expect(compiledContracts).to.have.property('Strings');
  });

  it('test Test.solpp contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('cross_lang/Test.solpp');
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