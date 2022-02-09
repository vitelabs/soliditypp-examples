import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe('test transfer', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
    console.log('deployer', deployer.address);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await vite.compile('transfer.solpp');
    expect(compiledContracts).to.have.property('A');

    // init user accounts
    const alice = vite.newAccount(config.networks.local.mnemonic, 1);
    console.log('alice', alice.address);
    const bob = vite.newAccount(config.networks.local.mnemonic, 2);
    console.log('bob', bob.address);
    await deployer.sendToken(alice.address, '200');
    await alice.receiveAll();
    await deployer.sendToken(bob.address, '100');
    await bob.receiveAll();

    // deploy
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    let balanceA = await a.balance();
    // console.log('balance of A:', balanceA);
    expect(balanceA).to.be.equal('0');

    // Alice sent 50 to the contract A
    const block = await alice.sendToken(a.address, '50');

    await vite.utils.waitFor(() => {
      return vite.isReceived(provider, block.hash);
    }, "Wait for receiving token");

    // check balance of A
    balanceA = await a.balance();
    // console.log('balance of A:', balanceA);
    expect(balanceA).to.be.equal('50');

    // check events of A
    let events = await a.getPastEvents('Received', {fromHeight: 0, toHeight: 0});
    expect(events[0]?.returnValues?.sender).to.be.equal(alice.address);
    expect(events[0]?.returnValues?.token).to.be.equal('tti_5649544520544f4b454e6e40');
    expect(events[0]?.returnValues?.amount).to.be.equal('50');

    // check balance of Alice
    let balanceAlice = await alice.balance();
    // console.log('balance of Alice:', balanceAlice);
    expect(balanceAlice).to.be.equal('150');

    // Alice call contract A.sendViteTo() to send token to Bob
    await a.call('sendViteTo', [bob.address, 30], {caller: alice});

    // check balance of Bob before receiving
    let balanceBob = await bob.balance();
    // console.log('balance of Bob:', balanceBob);
    expect(balanceBob).to.be.equal('100');

    // Bob recevie the money
    await bob.receiveAll();

    // check balance of Bob after receiving
    balanceBob = await bob.balance();
    // console.log('balance of Bob:', balanceBob);
    expect(balanceBob).to.be.equal('130');

    // check balance of A
    balanceA = await a.balance();
    // console.log('balance of A:', balanceA);
    expect(balanceA).to.be.equal('20');

  });
});