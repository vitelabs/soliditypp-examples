import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";


let provider: any;
let deployer: any;

describe('test AsyncCall', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
  });

  it('test contract', async () => {
    // compile
    const compiledContracts = await vite.compile('AsyncCall.solpp');
    expect(compiledContracts).has.property('A');
    expect(compiledContracts).has.property('B');

    // deploy A
    let a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    // deploy B
    let b = compiledContracts.B;
    b.setDeployer(deployer).setProvider(provider);
    await b.deploy({
      params: [a.address!]
    });
    expect(b.address).to.be.a('string');
    console.log(b.address);

    // call b.invoke(a, 'world');
    await b.call('invoke', [a.address!, 'world'], {});

    vite.utils.sleep(1000);

    // check events
    let events = await b.getPastEvents('Received', {fromHeight: 0, toHeight: 0});
    // console.log(events);
    expect(events).to.be.an('array');
    expect(events[0]).has.property('returnValues');
    expect(events[0].returnValues).has.property('data');
    expect(events[0].returnValues.data).to.be.equals('hello world');
 
  });
});