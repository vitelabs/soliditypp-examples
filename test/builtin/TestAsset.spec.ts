import { describe, utils } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../vite.config.json";

let provider: any;
let deployer: any;

describe('test Builtin Contract', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
  });

  it('test Built-in Asset', async () => {
    // init user accounts
    const alice = vite.newAccount(config.networks.local.mnemonic, 1, provider);
    await deployer.sendToken(alice.address, '100');
    await alice.receiveAll();

    // compile Test
    const compiledContracts = await vite.compile('builtin/TestAsset.solpp');
    expect(compiledContracts).to.have.property('Test');
    const contract = compiledContracts.Test;

    // compile built-in interface
    const builtinContracts = await vite.compile('builtin/builtin.solpp');
    expect(builtinContracts).to.have.property('BuiltinContractAssetInterface');
    const builtinAssetContract = builtinContracts.BuiltinContractAssetInterface;
    builtinAssetContract.address = 'vite_000000000000000000000000000000000000000595292d996d';
    builtinAssetContract.setProvider(provider);

    // deploy contract
    contract.setDeployer(deployer).setProvider(provider);
    await contract.deploy({});
    expect(contract.address).to.be.a('string');

    // call issue()
    await contract.call('issue', [], {});
    await contract.waitForHeight(4);

    // query token id
    const result = await contract.query('tokenId', []);
    expect(result).to.have.lengthOf(1);
    const tokenId = result[0];
    console.log('Token issued:', tokenId);

    // query built-in contract
    expect(await builtinAssetContract.query('name', [tokenId])).to.be.deep.equal(['Test Coin']);
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['100000']);

    // call getName()
    await contract.call("getName", [], {});
    await contract.waitForHeight(6);

    // query name
    expect(await contract.query('name', [])).to.be.deep.equal(['Test Coin']);

    // check initial supply
    await vite.utils.sleep(1000);
    expect(await contract.balance(tokenId)).to.be.equal('100000');

    // mint
    await contract.call("mint", ['100', alice.address], {});
    await contract.waitForHeight(8);
    await alice.receiveAll();

    // check mint amount
    expect(await alice.balance(tokenId)).to.be.equal('100');

    // check total supply
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['100100']);

    // burn
    await contract.call("burn", ['10000'], {});
    await contract.waitForHeight(10);
    await vite.utils.sleep(1000);
    expect(await contract.balance(tokenId)).to.be.equal('90000');

    // check total supply
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['90100']);

    // burn by Alice
    await builtinAssetContract.call("burn", [], {tokenId: tokenId, amount: '50', caller: alice});
    expect(await alice.balance(tokenId)).to.be.equal('50');

    // burn by raw transfer
    const block = await alice.sendToken(builtinAssetContract.address, '50', tokenId);
    await vite.utils.waitFor(() => {
      return vite.isReceived(provider, block.hash);
    }, "Wait for receiving token");

    expect(await alice.balance(tokenId)).to.be.equal('0');

    // check total supply
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['90000']);
  });
});