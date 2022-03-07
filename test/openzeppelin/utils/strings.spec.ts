import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../vite.config.json";

let provider: any;
let deployer: any;
let contract: any;
const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

describe('test open zeppelin', () => {
  before(async function() {
    provider = vite.newProvider("http://127.0.0.1:23456");
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
    // compile
    const compiledContracts = await vite.compile('openzeppelin/mocks/StringsMock.sol');
    expect(compiledContracts).to.have.property('StringsMock');
    contract = compiledContracts.StringsMock;
    // deploy
    contract.setDeployer(deployer).setProvider(provider);
    await contract.deploy({});
    expect(contract.address).to.be.a('string');
  });

  it('converts 0', async () => {
    expect(await contract.query('fromUint256', ['0'])).to.deep.equal(['0']);
  });

  it('converts a positive number', async function () {
    expect(await contract.query('fromUint256', ['4132'])).to.deep.equal(['4132']);
  });

  it('converts MAX_UINT256', async function () {
    expect(await contract.query('fromUint256', [MAX_UINT256])).to.deep.equal([MAX_UINT256]);
  });
});

describe('from uint256 - hex format', function () {
  it('converts 0', async function () {
    expect(await contract.query('fromUint256Hex', ['0'])).to.deep.equal(['0x00']);
  });

  it('converts a positive number', async function () {
    expect(await contract.query('fromUint256Hex', [0x4132.toString()])).to.deep.equal(['0x4132']);
  });

  it('converts MAX_UINT256', async function () {
    expect(await contract.query('fromUint256Hex', [MAX_UINT256]))
    .to.deep.equal(['0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff']);
  });
});

describe('from uint256 - fixed hex format', function () {
  it('converts a positive number (long)', async function () {
    expect(await contract.query('fromUint256HexFixed', [0x4132.toString(), '32']))
    .to.deep.equal(['0x0000000000000000000000000000000000000000000000000000000000004132']);
  });

  // TODO: query revert reason 
  // it('converts a positive number (short)', async function () {
  //   await expectRevert(
  //     this.strings.fromUint256HexFixed(0x4132, 1),
  //     'Strings: hex length insufficient',
  //   );
  // });

  it('converts MAX_UINT256', async function () {
    expect(await contract.query('fromUint256HexFixed', [MAX_UINT256, '32']))
    .to.deep.equal(['0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff']);
  });
});