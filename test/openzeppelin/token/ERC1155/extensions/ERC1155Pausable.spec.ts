import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../../vite.config.json";

let provider: any;
let deployer: any;
let operator: any;
let receiver: any;
let other: any;
let token: any;
const uri = 'https://token.com';

const firstTokenId = '37';
const firstTokenAmount = '42';

const secondTokenId = '19842';
const secondTokenAmount = '23';

describe('test OpenZeppelin ERC1155Pausable', () => {
	before(async function() {
		provider = vite.newProvider("http://127.0.0.1:23456");
		deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
		operator = vite.newAccount(config.networks.local.mnemonic, 1, provider);
		receiver = vite.newAccount(config.networks.local.mnemonic, 3, provider);
		other = vite.newAccount(config.networks.local.mnemonic, 4, provider);
		// compile
		const compiledERC1155PausableMockContracts = await vite.compile('openzeppelin/mocks/ERC1155PausableMock.sol');
		expect(compiledERC1155PausableMockContracts).to.have.property('ERC1155PausableMock');
		token = compiledERC1155PausableMockContracts.ERC1155PausableMock;
	});

	beforeEach(async function() {
		await deployer.sendToken(operator.address, '500');
		await operator.receiveAll();
		await deployer.sendToken(receiver.address, '500');
		await receiver.receiveAll();
		await deployer.sendToken(other.address, '500');
		await other.receiveAll();
		// build
		token.setDeployer(deployer).setProvider(provider);
		await token.deploy({params: [uri]});
		expect(token.address).to.be.a('string');
	});

	context('when token is paused', function () {
		beforeEach(async function () {
			await token.call('setApprovalForAll', [
					operator.address,
					true,
				], { caller: deployer }
			)

			await token.call('mint', [
					deployer.address,
					firstTokenId,
				  firstTokenAmount,
				  "0x00"
				], { caller: deployer }
			)

			await token.call('pause', [], { caller: deployer });
		});

		it('reverts when trying to safeTransferFrom from holder', async function () {
			try {
				await token.call("safeTransferFrom", [
					  deployer.address,
					  receiver.address,
					  firstTokenId,
					  firstTokenAmount,
					  "0x00"
					], { caller: deployer }
				)
				expect(false);
			} catch (e) {
				expect(true);
			}
		});

		it('reverts when trying to safeTransferFrom from operator', async function () {
			try {
				await token.call("safeTransferFrom", [
						deployer.address,
						receiver.address,
						firstTokenId,
						firstTokenAmount,
						"0x00"
					], { caller: operator }
				)
				expect(false);
			} catch (e) {
				expect(true);
			}
		});

		it('reverts when trying to safeBatchTransferFrom from holder', async function () {
			try {
				await token.call("safeBatchTransferFrom", [
						deployer.address,
						receiver.address,
						[firstTokenId],
						[firstTokenAmount],
						"0x00"
					], { caller: deployer }
				)
				expect(false);
			} catch (e) {
				expect(true);
			}

			it('reverts when trying to safeBatchTransferFrom from operator', async function () {
				try {
					await token.call("safeBatchTransferFrom", [
							deployer.address,
							receiver.address,
							[firstTokenId],
							[firstTokenAmount],
							"0x00"
						], { caller: operator }
					)
					expect(false);
				} catch (e) {
					expect(true);
				}
			});

			it('reverts when trying to mint', async function () {
				try {
					await token.call("mint", [
							deployer,
							secondTokenId,
							secondTokenAmount,
							"0x00"
						], { caller: deployer }
					)
					expect(false);
				} catch (e) {
					expect(true);
				}
			});

			it('reverts when trying to mintBatch', async function () {
				try {
					await token.call("mintBatch", [
							deployer,
							[secondTokenId],
							[secondTokenAmount],
							"0x00"
						], { caller: deployer }
					)
					expect(false);
				} catch (e) {
					expect(true);
				}
			});

			it('reverts when trying to burn', async function () {
				try {
					await token.call("burn", [
							deployer,
							firstTokenId,
							firstTokenAmount,
							"0x00"
						], { caller: deployer }
					)
					expect(false);
				} catch (e) {
					expect(true);
				}
			});

			it('reverts when trying to burnBatch', async function () {
				try {
					await token.call("burn", [
							deployer,
							[firstTokenId],
							[firstTokenAmount],
							"0x00"
						], { caller: deployer }
					)
					expect(false);
				} catch (e) {
					expect(true);
				}
			});

			describe('setApprovalForAll', function () {
				it('approves an operator', async function () {
					await token.call('setApprovalForAll', [
							other.address,
							true,
						], { caller: deployer }
					)

					expect(await token.query('isApprovedForAll', [deployer.address, other.address]))
						.to.be.deep.equal(["1"]);
				});
			});

			describe('balanceOf', function () {
				it('returns the amount of tokens owned by the given address', async function () {
					expect(await token.query('balanceOf', [deployer.address, firstTokenId]))
						.to.be.deep.equal([firstTokenAmount]);
				});
			});

			describe('isApprovedForAll', function () {
				it('returns the approval of the operator', async function () {
					expect(await token.query('isApprovedForAll', [deployer.address, operator.address]))
						.to.be.deep.equal(["1"]);
				});
			});
		});
	});
});