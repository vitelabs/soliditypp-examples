import { describe } from "mocha";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const expect = chai.expect;


const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test revert', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
  });

  it('test revert', async () => {
    // compile
    const compiledContracts = await vite.compile('revert.solpp');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');

    // deploy B
    let b = compiledContracts.B;
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({
      params: [a.address!]
    });
    expect(b.address).to.be.a('string');

    // B.assert(1234) should revert
    await expect(
      b.call('assertB', ['1234'], {})
    ).to.eventually.be.rejectedWith("revert"); 

    // call B.test()
    await b.call('test', [], {});

    // check state of B
    let result = await b.query('b', []);
    expect(result).to.be.deep.equal(['1']);

    // check state of A
    result = await a.query('data', []);
    // A.data remains 0 because that the receive transaction is reverted.
    expect(result).to.be.deep.equal(['0']);
  });
});