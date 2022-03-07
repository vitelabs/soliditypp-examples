import { describe } from "mocha";
import chai from 'chai';
import chaiThings from 'chai-things';
import chaiLike from 'chai-like';
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;

const expect = chai.expect;
chai.use(chaiLike);
chai.use(chaiThings); // the order of plugins matters

describe('test CallWithValue', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log('deployer', deployer.address);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await vite.compile('CallWithValueAsync.solpp');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');
    let a = compiledContracts.A;
    let b = compiledContracts.B;

    // deploy A
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');

    let balanceA = await a.balance();
    // console.log('balance of A:', balanceA);
    expect(balanceA).to.be.equal('0');

    // deploy B with 10 VITE
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({tokenId: 'tti_5649544520544f4b454e6e40', amount: '10000000000000000000',  params: [a.address]});
    expect(b.address).to.be.a('string');

    // B has 10 VITE in it's balance
    expect(await b.balance()).to.be.equal('10000000000000000000');

    // call the contract B.test(123)
    await b.call('test', ['123'], {});

    // check balance of B
    expect(await b.balance()).to.be.equal('9000000000000000000');

    // wait for A to receive requests from B
    await a.waitForHeight(2);

    // check balance of A
    expect(await a.balance()).to.be.equal('1000000000000000000');

    // check events of A
    let events = await a.getPastEvents('Received', {fromHeight: 1, toHeight: 3});
    expect(events).to.be.an('array').with.length(1);
    expect(events).to.contains.something.like({
      returnValues: {
        topic: '1',
        data: '123',
        token: 'tti_5649544520544f4b454e6e40',
        amount: '1000000000000000000'
      }
    });
  });
});