import { describe } from "mocha";
import { expect } from "chai";
import * as compiler from "../src/compiler";
import * as vite from "../src/vite";
import config from "./vite.config.json";
import { sleep } from "../src/utils";

let provider: any;
let deployer: any;

describe('test events', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await compiler.compile('events.solpp');
    expect(compiledContracts).to.have.property('A');

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    // call a.test();
    await a.call('test', [], {});

    sleep(1000);
    // check log
    let events = await a.getPastEvents('allEvents', {fromHeight: 2, toHeight: 2});
    // console.log(events);
    expect(events).to.be.an('array').with.length(4); // can't parse anonymous events due to the RPC issue
    expect(events[0].returnValues).to.be.deep.equal({
      '0': 'hello world',
      'data': 'hello world'
    });
    expect(events[1].returnValues).to.be.deep.equal({
      '0': '123',
      '1': 'hello world',
      i: '123',
      s: 'hello world'
    });
    expect(events[2].returnValues).to.be.deep.equal({
      '0': '1',
      '1': '123',
      '2': 'hello world',
      t: '1',
      i: '123',
      s: 'hello world'
    });
    expect(events[3].returnValues).to.be.deep.equal({
      '0': '123',
      '1': '1',
      '2': 'hello world',
      '3': 'afd7f7d4710d29fbfc539d707a42ff910cd4d41a4c9eae3356180f074e8c3da1',
      t1: '1',
      t2: 'afd7f7d4710d29fbfc539d707a42ff910cd4d41a4c9eae3356180f074e8c3da1',
      i: '123',
      s: 'hello world'
    });
  });
});