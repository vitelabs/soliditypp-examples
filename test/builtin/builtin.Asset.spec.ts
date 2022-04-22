import { describe, utils } from "mocha";
import config from "../vite.config.json";
const vite = require('@vite/vuilder');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const expect = chai.expect;

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
    const bob = vite.newAccount(config.networks.local.mnemonic, 2, provider);
    await deployer.sendToken(bob.address, '100');
    await bob.receiveAll();

    // compile built-in interface
    const builtinContracts = await vite.compile('builtin/builtin.solpp');
    expect(builtinContracts).to.have.property('BuiltinContractAssetInterface');
    const builtinAssetContract = builtinContracts.BuiltinContractAssetInterface;
    builtinAssetContract.address = 'vite_000000000000000000000000000000000000000595292d996d';
    builtinAssetContract.setProvider(provider);

    // call issue()
    const receiveBlock = await builtinAssetContract.call('issue', ['true', 'My Coin', 'MY', '1000', '1', '2000'], {caller: alice});
    await alice.receiveAll();
    expect(receiveBlock.triggeredSendBlockList).to.have.lengthOf(1);
    const triggered = receiveBlock.triggeredSendBlockList[0]
    const tokenId = triggered.tokenId;
    expect(triggered.amount).to.be.equal('1000');
    expect(await alice.balance(tokenId)).to.be.equal('1000');
    // check events
    let events = await builtinAssetContract.getPastEvents('allEvents', {fromHeight: 2, toHeight: 2});
    expect(events[0].event).to.be.equal('Issue');
    // expect(events[0].returnValues.tokenId).to.be.equal(tokenId);
    expect(events[0].returnValues.owner).to.be.equal(alice.address);

    // query built-in contract
    expect(await builtinAssetContract.query('name', [tokenId])).to.be.deep.equal(['My Coin']);
    expect(await builtinAssetContract.query('symbol', [tokenId])).to.be.deep.equal(['MY']);
    expect(await builtinAssetContract.query('decimals', [tokenId])).to.be.deep.equal(['1']);
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['1000']);
    expect(await builtinAssetContract.query('maxSupply', [tokenId])).to.be.deep.equal(['2000']);
    expect(await builtinAssetContract.query('mintable', [tokenId])).to.be.deep.equal(['1']);
    expect(await builtinAssetContract.query('owner', [tokenId])).to.be.deep.equal([alice.address]);

    // mint
    await builtinAssetContract.call("mint", [tokenId, bob.address, '100'], {caller: alice});
    await bob.receiveAll();
    expect(await bob.balance(tokenId)).to.be.equal('100');
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['1100']);
    // check events
    events = await builtinAssetContract.getPastEvents('allEvents', {fromHeight: 3, toHeight: 3});
    expect(events[0].event).to.be.equal('Mint');
    // expect(events[0].returnValues.tokenId).to.be.equal(tokenId);
    expect(events[0].returnValues.to).to.be.equal(bob.address);
    expect(events[0].returnValues.amount).to.be.equal('100');

    // burn
    await builtinAssetContract.call("burn", [], {tokenId: tokenId, amount: '50', caller: alice});
    expect(await alice.balance(tokenId)).to.be.equal('950');
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['1050']);
    // check events
    events = await builtinAssetContract.getPastEvents('allEvents', {fromHeight: 4, toHeight: 4});
    expect(events[0].event).to.be.equal('Burn');
    // expect(events[0].returnValues.tokenId).to.be.equal(tokenId);
    expect(events[0].returnValues.amount).to.be.equal('50');

    // burn by raw transfer
    const block = await bob.sendToken(builtinAssetContract.address, '50', tokenId);
    await vite.utils.waitFor(() => {
      return vite.isReceived(provider, block.hash);
    }, "Wait for receiving token");
    expect(await bob.balance(tokenId)).to.be.equal('50');
    expect(await builtinAssetContract.query('totalSupply', [tokenId])).to.be.deep.equal(['1000']);
    // check events
    events = await builtinAssetContract.getPastEvents('allEvents', {fromHeight: 5, toHeight: 5});
    expect(events[0].event).to.be.equal('Burn');
    // expect(events[0].returnValues.tokenId).to.be.equal(tokenId);
    expect(events[0].returnValues.amount).to.be.equal('50');

    // transfer ownership
    await builtinAssetContract.call("transferOwnership", [tokenId, bob.address], {caller: alice});
    expect(await builtinAssetContract.query('owner', [tokenId])).to.be.deep.equal([bob.address]);
    // check events
    events = await builtinAssetContract.getPastEvents('allEvents', {fromHeight: 6, toHeight: 6});
    expect(events[0].event).to.be.equal('OwnershipTransferred');
    // expect(events[0].returnValues.tokenId).to.be.equal(tokenId);
    expect(events[0].returnValues.previousOwner).to.be.equal(alice.address);
    expect(events[0].returnValues.newOwner).to.be.equal(bob.address);

    // Alice's ownership should be renounced
    await expect(
      builtinAssetContract.call("transferOwnership", [tokenId, alice.address], {caller: alice})
    ).to.eventually.be.rejectedWith("revert"); 

  });
});