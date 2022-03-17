import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let alice: any;
let bob: any;
let charlie: any;
let contract: any;

const name = 'Non Fungible Token';
const symbol = 'NFT';
const firstTokenId = '5042';
const secondTokenId = '79217';

describe('test NFT', function () {
  before(async function () {
    provider = vite.newProvider("http://127.0.0.1:23456");
    // init users
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
    alice = vite.newAccount(config.networks.local.mnemonic, 1, provider);
    bob = vite.newAccount(config.networks.local.mnemonic, 2, provider);
    charlie = vite.newAccount(config.networks.local.mnemonic, 3, provider);
    await deployer.sendToken(alice.address, '0');
    await alice.receiveAll();
    await deployer.sendToken(bob.address, '0');
    await bob.receiveAll();
    await deployer.sendToken(charlie.address, '0');
    await charlie.receiveAll();
    // compile
    const compiledContracts = await vite.compile('NFT.solpp');
    expect(compiledContracts).to.have.property('NFT');
    contract = compiledContracts.NFT;
    // deploy
    contract.setDeployer(deployer).setProvider(provider);
    await contract.deploy({params: [name, symbol], responseLatency: 1});
    expect(contract.address).to.be.a('string');
    // mint
    await contract.call('mint', [deployer.address, firstTokenId], {});
    await contract.call('mint', [deployer.address, secondTokenId], {});
  });

  describe('balanceOf', function () {
    context('when the given address does not own any tokens', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        expect(await contract.query('balanceOf', [deployer.address])).to.be.deep.equal(['2']);
      });
    });

    context('when the given address does not own any tokens', function () {
      it('returns 0', async function () {
        expect(await contract.query('balanceOf', [alice.address])).to.be.deep.equal(['0']);
      });
    });
  });

  describe('ownerOf', function () {
    context('when the given token ID was tracked by this token', function () {
      const tokenId = firstTokenId;

      it('returns the owner of the given token ID', async function () {
        expect(await contract.query('ownerOf', [tokenId])).to.be.deep.equal([deployer.address]);
      });
    });
  });

  describe('transfers', function () {
    it('owner transfers the ownership of firstToken to the given address', async function () {
      await contract.call('transferFrom', [deployer.address, charlie.address, firstTokenId], {caller: deployer});
      expect(await contract.query('ownerOf', [firstTokenId])).to.be.deep.equal([charlie.address]);
    });

    it('adjusts owners balances', async function () {
      expect(await contract.query('balanceOf', [deployer.address])).to.be.deep.equal(['1']);
    });

    it('adjusts owners tokens by index', async function () {
      expect(await contract.query('tokenOfOwnerByIndex', [charlie.address, '0'])).to.be.deep.equal([firstTokenId]);
      expect(await contract.query('tokenOfOwnerByIndex', [deployer.address, '0'])).to.be.not.deep.equal([firstTokenId]);
    });

  });

  describe('transfers by the approved individual', function () {
    before(async function () {
      await contract.call('approve', [alice.address, secondTokenId], {caller: deployer});
    });

    it('owner transfers the ownership of firstToken to the given address', async function () {
      await contract.call('transferFrom', [deployer.address, charlie.address, secondTokenId], {caller: alice});
      expect(await contract.query('ownerOf', [secondTokenId])).to.be.deep.equal([charlie.address]);
    });

    it('adjusts owners balances', async function () {
      expect(await contract.query('balanceOf', [deployer.address])).to.be.deep.equal(['0']);
    });

    it('adjusts owners tokens by index', async function () {
      expect(await contract.query('tokenOfOwnerByIndex', [charlie.address, '1'])).to.be.deep.equal([secondTokenId]);
    });
  });
});