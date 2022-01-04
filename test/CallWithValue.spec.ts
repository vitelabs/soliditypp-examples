import { describe } from "mocha";
import chai from 'chai';
import chaiThings from 'chai-things';
import chaiLike from 'chai-like';
import * as compiler from "../src/compiler";
import * as vite from "../src/vite";
import * as utils from "../src/utils";
import config from "./vite.config.json";

let provider: any;
let deployer: any;

const expect = chai.expect;
chai.use(chaiLike);
chai.use(chaiThings); // the order of plugins matters

describe('test CallWithValue', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
    console.log('deployer', deployer.address);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('CallWithValue.solpp');
    expect(compiledContracts).to.have.property('A');
    expect(compiledContracts).to.have.property('B');
    let a = compiledContracts.A;
    let b = compiledContracts.B;

    // deploy A
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    let balanceA = await a.balance();
    // console.log('balance of A:', balanceA);
    expect(balanceA).to.be.equal('0');

    // deploy B with 10 VITE
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({tokenId: 'tti_5649544520544f4b454e6e40', amount: '10000000000000000000',  params: [a.address]});
    expect(b.address).to.be.a('string');
    console.log(b.address);

    // B has 10 VITE in it's balance
    expect(await b.balance()).to.be.equal('10000000000000000000');

    // let height = await b.height();
    // console.log('height of B', height);

    // call the contract B.test(123)
    const block = await b.call('test', ['123'], {});
    // console.log(block);

    // height = await b.height();
    // console.log('height of B', height);

    await b.waitForHeight(2);

    // check balance of B
    expect(await b.balance()).to.be.equal('7000000000000000000');

    // wait for A to receive all of two requests from B
    await a.waitForHeight(3);

    // check balance of A
    expect(await a.balance()).to.be.equal('3000000000000000000');

    // check events of A
    let events = await a.getPastEvents('Received', {fromHeight: 2, toHeight: 3});
    expect(events).to.be.an('array').with.length(2);
    expect(events).to.contains.something.like({
      returnValues: {
        topic: '1',
        data: '123',
        token: 'tti_5649544520544f4b454e6e40',
        amount: '1000000000000000000'
      }
    });
    expect(events).to.contains.something.like({
      returnValues: {
        topic: '2',
        data: '123',
        token: 'tti_5649544520544f4b454e6e40',
        amount: '2000000000000000000'
      }
    });

    // check return values of the sync call
    expect(await b.query('b')).to.be.deep.equal(['124']);

  });
});