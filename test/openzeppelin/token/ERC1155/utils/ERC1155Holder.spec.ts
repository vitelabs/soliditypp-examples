import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../../vite.config.json";

let provider: any;
let deployer: any;
let multiToken: any;
let holder: any;
const uri = 'https://token-cdn-domain/{id}.json';
const multiTokenIds = ['1', '2', '3'];
const multiTokenAmounts = ['1000', '2000', '3000'];
const transferData = '0x12345678';

describe('test OpenZeppelin ERC1155Holder', () => {
	before(async function() {
		provider = vite.newProvider("http://127.0.0.1:23456");
		deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
		// compile
		const compiledERC1155MockContracts = await vite.compile('openzeppelin/mocks/ERC1155Mock.sol');
		expect(compiledERC1155MockContracts).to.have.property('ERC1155Mock');
		multiToken = compiledERC1155MockContracts.ERC1155Mock;

		const compiledERC1155HolderContracts = await vite.compile('openzeppelin/token/ERC1155/utils/ERC1155Holder.sol');
		expect(compiledERC1155HolderContracts).to.have.property('ERC1155Holder');
		holder = compiledERC1155HolderContracts.ERC1155Holder;
	});

	beforeEach(async function() {
		// build
		multiToken.setDeployer(deployer).setProvider(provider);
		await multiToken.deploy({params: [uri]});
		expect(multiToken.address).to.be.a('string');

		holder.setDeployer(deployer).setProvider(provider);
		await holder.deploy({});
		expect(holder.address).to.be.a('string');
		await multiToken.call('mintBatch', [deployer.address, multiTokenIds, multiTokenAmounts, transferData], { caller: deployer });
	});

	it('receives ERC1155 tokens from a single ID', async function () {
		const height = await multiToken.height();
		await multiToken.call('safeTransferFrom', [
			deployer.address,
			holder.address,
			multiTokenIds[0],
			multiTokenAmounts[0],
			transferData
			], { caller: deployer }
		)
		await multiToken.waitForHeight(height + 2);

		expect(await multiToken.query('balanceOf', [holder.address, multiTokenIds[0]]))
			.to.be.deep.equal([multiTokenAmounts[0]]);

		for (let i = 1; i < multiTokenIds.length; i++) {
			expect(await multiToken.query('balanceOf', [holder.address, multiTokenIds[i]]))
				.to.be.deep.equal(['0']);
		}
	});

	it('receives ERC1155 tokens from a multiple IDs', async function () {
		for (let i = 0; i < multiTokenIds.length; i++) {
			expect(await multiToken.query('balanceOf', [holder.address, multiTokenIds[i]]))
				.to.be.deep.equal(['0']);
		}

		const height = await multiToken.height();
		await multiToken.call('safeBatchTransferFrom', [
				deployer.address,
				holder.address,
				multiTokenIds,
				multiTokenAmounts,
				transferData
			], { caller: deployer }
		)

		await multiToken.waitForHeight(height + 2);

		for (let i = 0; i < multiTokenIds.length; i++) {
			expect(await multiToken.query('balanceOf', [holder.address, multiTokenIds[i]]))
				.to.be.deep.equal([multiTokenAmounts[i]]);
		}
	});
});