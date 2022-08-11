import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import { CommonUtil } from "./utils"
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let a: any;

describe('test events', () => {
  before(async function () {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
    // compile
    const compiledContracts = await vite.compile('events.solpp');
    expect(compiledContracts).to.have.property('A');

    // deploy A
    a = compiledContracts.A;
    a.setDeployer(deployer).setProvider(provider);
    await a.deploy({});
    expect(a.address).to.be.a('string');
    console.log(a.address);

    // call a.test();
    await a.call('test', [], {});
    await a.call('test', [], {});
    await a.call('test', [], {});

    vite.utils.sleep(1000);
  });

  it('test contract', async () => {
    // check log
    let events = await a.getPastEvents('allEvents', { fromHeight: 2, toHeight: 2 });
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

  var runs = [
    { id: '1', options: { fromHeight: "0", toHeight: "0", pageIndex: 0, pageSize: 0, expected: 4 } },
    { id: '2', options: { fromHeight: "0", toHeight: "0", pageIndex: 0, pageSize: 2, expected: 2 } },
    { id: '3', options: { fromHeight: "0", toHeight: "0", pageIndex: 1, pageSize: 2, expected: 2 } },
    { id: '4', options: { fromHeight: "0", toHeight: "0", pageIndex: 2, pageSize: 2, expected: 0 } },
    { id: '5', options: { fromHeight: "1", toHeight: "1", pageIndex: 0, pageSize: 0, expected: 0 } },
    { id: '6', options: { fromHeight: "0", toHeight: "1", pageIndex: 0, pageSize: 0, expected: 0 } },
    { id: '7', options: { fromHeight: "0", toHeight: "100", pageIndex: 0, pageSize: 0, expected: 4 } },
    { id: '8', options: { fromHeight: "100", toHeight: "0", pageIndex: 0, pageSize: 0, expected: 4 } },
    { id: '9', options: { fromHeight: "1", toHeight: "100", pageIndex: 0, pageSize: 0, expected: 12 } },
    { id: '10', options: { fromHeight: "1", toHeight: "100", pageIndex: 1, pageSize: 9, expected: 3 } },
  ]

  runs.forEach(function (run) {
    it('test ledger_getVmLogsByFilter ' + run.id, async () => {
      let logs = await getVmLogsByFilterAsync(
        run.options.fromHeight,
        run.options.toHeight,
        run.options.pageIndex,
        run.options.pageSize
      )
      if (run.options.expected > 0) {
        expect(logs).to.be.an('array').with.length(run.options.expected);
      } else {
        expect(logs).to.be.null
      }
    });
  })

  it('test ledger_getVmLogsByFilter error', async () => {
    const result = await CommonUtil.expectThrowsAsync(() => getVmLogsByFilterAsync("100", "1", 0, 0))
    expect(result.error.code).to.be.equal(-32002)
    expect(result.error.message).to.be.equal('to height < from height')
  });

  function getVmLogsByFilterAsync(fromHeight: string, toHeight: string, pageIndex: number, pageSize: number) {
    return provider.request("ledger_getVmLogsByFilter",
      {
        "addressHeightRange": {
          [a.address]: {
            "fromHeight": fromHeight,
            "toHeight": toHeight
          }
        },
        pageIndex: pageIndex,
        pageSize: pageSize
      });
  }
});