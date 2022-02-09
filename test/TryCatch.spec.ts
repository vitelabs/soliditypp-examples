import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test TryCatch.sol', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
  });

  it('test try catch', async () => {
    // compile
    const compiledContracts = await vite.compile('TryCatch.sol');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');
    expect(compiledContracts).to.have.property('C');

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

    // deploy C
    let c = compiledContracts.C;
    c.setDeployer(deployer).setProvider(provider);
    await c.deploy({
      params: [b.address!]
    });
    expect(c.address).to.be.a('string');

    // call C.f(1), should success
    await c.call('invoke', ['1'], {});

    // check state of C
    let result = await c.query('data', []);
    expect(result).to.be.deep.equal(['2']);
    result = await c.query('err', []);
    expect(result).to.be.deep.equal(['OK']);

    // check state of B
    result = await b.query('b', []);
    expect(result).to.be.deep.equal(['2']);
    result = await b.query('s', []);
    expect(result).to.be.deep.equal(['OK']);

    // check state of A
    result = await a.query('data', []);
    expect(result).to.be.deep.equal(['1']);

    // call C.f(10), should fail
    await c.call('invoke', ['10'], {});

    // check state of C
    result = await c.query('data', []);
    expect(result).to.be.deep.equal(['0']);
    result = await c.query('err', []);
    expect(result).to.be.deep.equal(['too big']);

    // check state of B
    result = await b.query('b', []);
    expect(result).to.be.deep.equal(['0']);
    result = await b.query('s', []);
    expect(result).to.be.deep.equal(['too big']);

    // check state of A
    result = await a.query('data', []);
    // A.data remains 1 because that the second receive transaction is reverted.
    expect(result).to.be.deep.equal(['1']);
  });
});