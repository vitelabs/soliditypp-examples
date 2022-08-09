import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../../vite.config.json";

let provider: any;
let deployer: any;
let operator: any;
let token: any;
const uri = 'https://token.com';
const tokenIds = ['42', '1137'];
const amounts = ['3000', '9902'];

describe('test OpenZeppelin ERC1155Burnable', () => {
	before(async function() {
		provider = vite.newProvider("http://127.0.0.1:23456");
		deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
		operator = vite.newAccount(config.networks.local.mnemonic, 1, provider);
		// compile
		const compiledERC1155BurnableMockContracts = await vite.compile('openzeppelin/mocks/ERC1155BurnableMock.sol');
		expect(compiledERC1155BurnableMockContracts).to.have.property('ERC1155BurnableMock');
		token = compiledERC1155BurnableMockContracts.ERC1155BurnableMock;
	});

	beforeEach(async function() {
		await deployer.sendToken(operator.address, '500');
		await operator.receiveAll();
		// build
		token.setDeployer(deployer).setProvider(provider);
		await token.deploy({params: [uri]});
		expect(token.address).to.be.a('string');
		await token.call('mint', [deployer.address, tokenIds[0], amounts[0], '0x00'], { caller: deployer });
		await token.call('mint', [deployer.address, tokenIds[1], amounts[1], '0x00'], { caller: deployer });
	});

	describe('burn', function () {
		it('holder can burn their tokens', async function () {
			await token.call('burn', [
					deployer.address,
					tokenIds[0],
					(parseInt(amounts[0]) - 1).toString(),
				], { caller: deployer }
			)

			expect(await token.query('balanceOf', [deployer.address, tokenIds[0]]))
				.to.be.deep.equal(['1']);
		});

		it('approved operators can burn the holder\'s tokens', async function () {
			await token.call('setApprovalForAll', [
					operator.address,
					true,
				], { caller: deployer }
			)

			await token.call('burn', [
					deployer.address,
					tokenIds[0],
					(parseInt(amounts[0]) - 1).toString(),
				], { caller: operator }
			)

			expect(await token.query('balanceOf', [deployer.address, tokenIds[0]]))
				.to.be.deep.equal(['1']);
		});

		it('unapproved accounts cannot burn the holder\'s tokens', async function () {
			try {
				await token.call('burn', [
						deployer.address,
						tokenIds[0],
						(parseInt(amounts[0]) - 1).toString(),
					], { caller: operator }
				)
				expect(false);
			} catch (e) {
				expect(true);
			}
		});
	});

	describe('burnBatch', function () {
		it('holder can burn their tokens', async function () {
			await token.call('burnBatch', [
					deployer.address,
					tokenIds,
					[(parseInt(amounts[0]) - 1).toString(), (parseInt(amounts[1]) - 2).toString()],
				], { caller: deployer }
			)

			expect(await token.query('balanceOf', [deployer.address, tokenIds[0]]))
				.to.be.deep.equal(['1']);
			expect(await token.query('balanceOf', [deployer.address, tokenIds[1]]))
				.to.be.deep.equal(['2']);
		});

		it('approved operators can burn the holder\'s tokens', async function () {
			await token.call('setApprovalForAll', [
					operator.address,
					true,
				], { caller: deployer }
			)

			await token.call('burnBatch', [
					deployer.address,
					tokenIds,
					[(parseInt(amounts[0]) - 1).toString(), (parseInt(amounts[1]) - 2).toString()],
				], { caller: operator }
			)

			expect(await token.query('balanceOf', [deployer.address, tokenIds[0]]))
				.to.be.deep.equal(['1']);
			expect(await token.query('balanceOf', [deployer.address, tokenIds[1]]))
				.to.be.deep.equal(['2']);
		});

		it('unapproved accounts cannot burn the holder\'s tokens', async function () {
			try {
				await token.call('burnBatch', [
						deployer.address,
						tokenIds,
						[(parseInt(amounts[0]) - 1).toString(), (parseInt(amounts[1]) - 2).toString()],
					], { caller: operator }
				)
				expect(false);
			} catch (e) {
				expect(true);
			}
		});
	});
});