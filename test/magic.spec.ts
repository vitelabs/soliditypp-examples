import { describe } from "mocha";
import { expect } from "chai";
import * as compiler from "../src/compiler";
import * as vite from "../src/vite";
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test magic', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('magic.solpp');
    expect(compiledContracts).to.have.property('Magic');
    let magic = compiledContracts.Magic;

    // deploy by setting a random degree which is greater than 0
    magic.setDeployer(deployer).setProvider(provider);
    await magic.deploy({randomDegree: 1, responseLatency: 1});
    expect(magic.address).to.be.a('string');

    // blake2b
    expect(await magic.query('_blake2b', ['hello world'])).to.be.deep.equal(['256c83b297114d201b30179f3f0ef0cace9783622da5974326b436178aeef610']);

    // keccak256
    expect(await magic.query('_keccak256', ['hello world'])).to.be.deep.equal(['47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad']);

    // sha256
    // @fixme: not work
    // expect(await magic.query('_sha256', ['hello world'])).to.be.deep.equal(['b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9']);

    // _ripemd160
    // @fixme: not work
    // expect(await magic.query('_ripemd160', ['hello world'])).to.be.deep.equal(['98c615784ccb5fe5936fbc0cbe9dfdb408d92f0f']);

    // selector
    expect(await magic.query('_selector', [])).to.be.deep.equal(['7321116e']);

    // nextRandom
    // @fixme: not work

    // balance
    expect(await magic.query('balanceOfVITE', [])).to.be.deep.equal(['0']);

    // prev hash
    const block = await provider.request("ledger_getAccountBlockByHeight", magic.address, 1);
    expect(await magic.query('getPrevHash', [])).to.be.deep.equal([block.hash]);

    // account height
    expect(await magic.query('getAccountHeight', [])).to.be.deep.equal(['1']);

  });
});