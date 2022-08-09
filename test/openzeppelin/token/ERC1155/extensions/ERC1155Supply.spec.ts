import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../../vite.config.json";

let provider: any;
let deployer: any;
let token: any;
const uri = 'https://token.com';

const firstTokenId = '37';
const firstTokenAmount = '42';

const secondTokenId = '19842';
const secondTokenAmount = '23';

describe('test OpenZeppelin ERC1155Supply', () => {
	before(async function() {
		provider = vite.newProvider("http://127.0.0.1:23456");
		deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
		// compile
		const compiledERC1155SupplyMockContracts = await vite.compile('openzeppelin/mocks/ERC1155SupplyMock.sol');
		expect(compiledERC1155SupplyMockContracts).to.have.property('ERC1155SupplyMock');
		token = compiledERC1155SupplyMockContracts.ERC1155SupplyMock;
	});

	beforeEach(async function() {
		// build
		token.setDeployer(deployer).setProvider(provider);
		await token.deploy({params: [uri]});
		expect(token.address).to.be.a('string');
	});

	context('before mint', function () {
		it('exist', async function () {
			expect(await token.query('exists', [firstTokenId]))
				.to.be.deep.equal(["0"]);
		});

		it('totalSupply', async function () {
			expect(await token.query('totalSupply', [firstTokenId]))
				.to.be.deep.equal(["0"]);
		});
	});

	context('after mint', function () {
		context('single', function () {
			beforeEach(async function () {
				await token.call('mint', [
						deployer.address,
					  firstTokenId,
						firstTokenAmount,
					  "0x00"
					], { caller: deployer }
				)
			});

			it('exist', async function () {
				expect(await token.query('exists', [firstTokenId]))
					.to.be.deep.equal(["1"]);
			});

			it('totalSupply', async function () {
				expect(await token.query('totalSupply', [firstTokenId]))
					.to.be.deep.equal([firstTokenAmount]);
			});
		});

		context('batch', function () {
			beforeEach(async function () {
				await token.call('mintBatch', [
						deployer.address,
					  [ firstTokenId, secondTokenId ],
					  [ firstTokenAmount, secondTokenAmount ],
						"0x00"
					], { caller: deployer }
				)
			});

			it('exist', async function () {
				expect(await token.query('exists', [firstTokenId]))
					.to.be.deep.equal(["1"]);
				expect(await token.query('exists', [secondTokenId]))
					.to.be.deep.equal(["1"]);
			});

			it('totalSupply', async function () {
				expect(await token.query('totalSupply', [firstTokenId]))
					.to.be.deep.equal([firstTokenAmount]);
				expect(await token.query('totalSupply', [secondTokenId]))
					.to.be.deep.equal([secondTokenAmount]);
			});
		});
	});

	context('after burn', function () {
		context('single', function () {
			beforeEach(async function () {
				await token.call('mint', [
						deployer.address,
						firstTokenId,
						firstTokenAmount,
						"0x00"
					], { caller: deployer }
				)

				await token.call('burn', [
						deployer.address,
						firstTokenId,
						firstTokenAmount,
					], { caller: deployer }
				)
			});

			it('exist', async function () {
				expect(await token.query('exists', [firstTokenId]))
					.to.be.deep.equal(["0"]);
			});

			it('totalSupply', async function () {
				expect(await token.query('totalSupply', [firstTokenId]))
					.to.be.deep.equal(["0"]);
			});
		});

		context('batch', function () {
			beforeEach(async function () {
				await token.call('mintBatch', [
						deployer.address,
					  [ firstTokenId, secondTokenId ],
					  [ firstTokenAmount, secondTokenAmount ],
						"0x00"
					], { caller: deployer }
				)

				await token.call('burnBatch', [
						deployer.address,
					  [ firstTokenId, secondTokenId ],
					  [ firstTokenAmount, secondTokenAmount ],
					], { caller: deployer }
				)
			});

			it('exist', async function () {
				expect(await token.query('exists', [firstTokenId]))
					.to.be.deep.equal(["0"]);
				expect(await token.query('exists', [secondTokenId]))
					.to.be.deep.equal(["0"]);
			});

			it('totalSupply', async function () {
				expect(await token.query('totalSupply', [firstTokenId]))
					.to.be.deep.equal(["0"]);
				expect(await token.query('totalSupply', [secondTokenId]))
					.to.be.deep.equal(["0"]);
			});
		});
	});
});