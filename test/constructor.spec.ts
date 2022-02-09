import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import { Account } from "@vite/vitejs-accountblock";
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test constructor', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
    console.log('deployer', deployer.address);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await vite.compile('constructor.solpp');
    expect(compiledContracts).to.have.property('Test');

    // deploy
    let contract = compiledContracts.Test;
    contract.setDeployer(deployer).setProvider(provider);
    await contract.deploy({
      params: ['111']
    });
    expect(contract.address).to.be.a('string');
    console.log(contract.address);

    // check default value of data
    let result = await contract.query('data', []);

    console.log('return', result);
    expect(result).to.be.an('array').with.lengthOf(1);
    expect(result![0]).to.be.equal('111');

    // call HelloWorld.set(456);
    await contract.call('set', ['456'], {});

    // check value of data
    result = await contract.query('data', []);
    console.log('return', result);
    expect(result).to.be.an('array').with.lengthOf(1);
    expect(result![0]).to.be.equal('456');
  });
});