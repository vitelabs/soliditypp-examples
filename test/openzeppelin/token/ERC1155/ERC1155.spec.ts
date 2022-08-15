import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../vite.config.json";

const ZERO_ADDRESS = "vite_0000000000000000000000000000000000000000a4f3a0cb58"

let provider: any;
let deployer: any;
let operator: any;
let tokenHolder: any;
let tokenBatchHolder: any;

let sideMinter: any;
let sideFirstTokenHolder: any;
let sideSecondTokenHolder: any;
let sideMultiTokenHolder: any;
let sideRecipient: any;
let sideProxy: any;

let token: any;
let receiver: any;

const initialURI = 'https://token-cdn-domain/{id}.json';

describe('test OpenZeppelin ERC1155', () => {
	provider = vite.newProvider("http://127.0.0.1:23456");
	deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
	operator = vite.newAccount(config.networks.local.mnemonic, 1, provider);
	tokenHolder = vite.newAccount(config.networks.local.mnemonic, 2, provider);
	tokenBatchHolder = vite.newAccount(config.networks.local.mnemonic, 3, provider);
	sideMinter = vite.newAccount(config.networks.local.mnemonic, 4, provider);
	sideFirstTokenHolder = vite.newAccount(config.networks.local.mnemonic, 5, provider);
	sideSecondTokenHolder = vite.newAccount(config.networks.local.mnemonic, 6, provider);
	sideMultiTokenHolder = vite.newAccount(config.networks.local.mnemonic, 7, provider);
	sideRecipient = vite.newAccount(config.networks.local.mnemonic, 8, provider);
	sideProxy = vite.newAccount(config.networks.local.mnemonic, 9, provider);

	before(async function() {
		await deployer.sendToken(operator.address, '500');
		await operator.receiveAll();
		await deployer.sendToken(tokenHolder.address, '500');
		await tokenHolder.receiveAll();
		await deployer.sendToken(tokenBatchHolder.address, '500');
		await tokenBatchHolder.receiveAll();
		await deployer.sendToken(sideMinter.address, '500');
		await sideMinter.receiveAll();
		await deployer.sendToken(sideFirstTokenHolder.address, '500');
		await sideFirstTokenHolder.receiveAll();
		await deployer.sendToken(sideSecondTokenHolder.address, '500');
		await sideSecondTokenHolder.receiveAll();
		await deployer.sendToken(sideMultiTokenHolder.address, '500');
		await sideMultiTokenHolder.receiveAll();
		await deployer.sendToken(sideRecipient.address, '500');
		await sideRecipient.receiveAll();
		await deployer.sendToken(sideProxy.address, '500');
		await sideProxy.receiveAll();
		// compile
		const compiledERC1155MockContracts = await vite.compile('openzeppelin/mocks/ERC1155Mock.sol');
		expect(compiledERC1155MockContracts).to.have.property('ERC1155Mock');
		token = compiledERC1155MockContracts.ERC1155Mock;
		const compiledERC1155ReceiverMockContracts = await vite.compile('openzeppelin/mocks/ERC1155ReceiverMock.sol');
		expect(compiledERC1155ReceiverMockContracts).to.have.property('ERC1155ReceiverMock');
		receiver = compiledERC1155ReceiverMockContracts.ERC1155ReceiverMock;
	});

	beforeEach(async function() {
		// build
		token.setDeployer(deployer).setProvider(provider);
		await token.deploy({params: [initialURI]});
		expect(token.address).to.be.a('string');
	});

	describe('like an ERC1155', function () {
		const firstTokenId = "1";
		const secondTokenId = "2";
		const unknownTokenId = "3";

		const firstAmount = "1000";
		const secondAmount = "2000";

		const RECEIVER_SINGLE_MAGIC_VALUE = '0x28b4f87f';
		const RECEIVER_BATCH_MAGIC_VALUE = '0x2deca5c3';

		describe('balanceOf', function () {
			it('reverts when queried about the zero address', async function () {
				try {
					await token.call('balanceOf', [ZERO_ADDRESS, firstTokenId], {caller: sideMinter});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			context('when accounts don\'t own tokens', function () {
				it('returns zero for given addresses', async function () {
					expect(await token.query("balanceOf", [sideFirstTokenHolder.address, firstTokenId])).to.be.deep.equal(["0"]);
					expect(await token.query("balanceOf", [sideSecondTokenHolder.address, secondTokenId])).to.be.deep.equal(["0"]);
					expect(await token.query("balanceOf", [sideFirstTokenHolder.address, unknownTokenId])).to.be.deep.equal(["0"]);
				});
			});

			context('when accounts own some tokens', function () {
				beforeEach(async function () {
					await token.call("mint", [sideFirstTokenHolder.address, firstTokenId, firstAmount, '0x00'], {caller: sideMinter});
					await token.call("mint", [sideSecondTokenHolder.address, secondTokenId, secondAmount, '0x00'], {caller: sideMinter});
				});

				it('returns the amount of tokens owned by the given addresses', async function () {
					expect(await token.query("balanceOf", [sideFirstTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount])
					expect(await token.query("balanceOf", [sideSecondTokenHolder.address, secondTokenId])).to.be.deep.equal([secondAmount])
					expect(await token.query("balanceOf", [sideFirstTokenHolder.address, unknownTokenId])).to.be.deep.equal(['0'])
				});
			});
		});

		describe('balanceOfBatch', function () {
			it('reverts when input arrays don\'t match up', async function () {
				try {
					await token.call("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address, sideFirstTokenHolder.address, sideSecondTokenHolder.address],
						[firstTokenId, secondTokenId, unknownTokenId],
					], {caller: sideMinter});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}

				try {
					await token.call("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address],
						[firstTokenId, secondTokenId, unknownTokenId],
					], {caller: sideMinter});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			it('reverts when one of the addresses is the zero address', async function () {
				try {
					await token.call("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address, ZERO_ADDRESS],
						[firstTokenId, secondTokenId, unknownTokenId],
					], {caller: sideMinter});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			context('when accounts don\'t own tokens', function () {
				it('returns zeros for each account', async function () {
					const result = await token.query("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address, sideFirstTokenHolder.address],
						[firstTokenId, secondTokenId, unknownTokenId],
					]);
					expect(result).to.be.deep.equal([['0', '0', '0']])
				});
			});

			context('when accounts own some tokens', function () {
				beforeEach(async function () {
					await token.call("mint", [sideFirstTokenHolder.address, firstTokenId, firstAmount, "0x00"], {caller: sideMinter});
					await token.call("mint", [sideSecondTokenHolder.address, secondTokenId, secondAmount, "0x00"], {caller: sideMinter});
				});

				it('returns amounts owned by each account in order passed', async function () {
					const result = await token.query("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address, sideFirstTokenHolder.address],
						[firstTokenId, secondTokenId, unknownTokenId],
					]);
					expect(result).to.be.deep.equal([[firstAmount, secondAmount, '0']])
				});

				it('returns multiple times the balance of the same address when asked', async function () {
					const result = await token.query("balanceOfBatch", [
						[sideFirstTokenHolder.address, sideSecondTokenHolder.address, sideFirstTokenHolder.address],
						[firstTokenId, secondTokenId, firstTokenId],
					]);
					expect(result).to.be.deep.equal([[firstAmount, secondAmount, firstAmount]])
				});
			});
		});

		describe('setApprovalForAll', function () {
			beforeEach(async function () {
				const height = await token.height();
				await token.call("setApprovalForAll", [
					sideProxy.address,
					true,
				], {caller: sideMultiTokenHolder});
				await token.waitForHeight(height + 1);
				this.events = await token.getPastEvents('allEvents', {fromHeight: height});
			});

			it('sets approval status which can be queried via isApprovedForAll', async function () {
				expect(await token.query("isApprovedForAll", [sideMultiTokenHolder.address, sideProxy.address])).to.be.deep.equal(["1"]);
			});

			it('emits an ApprovalForAll log', function () {
				expect(this.events[this.events.length - 1].event).to.be.equal("ApprovalForAll");
				expect(this.events[this.events.length - 1].returnValues.account).to.be.equal(sideMultiTokenHolder.address);
				expect(this.events[this.events.length - 1].returnValues.operator).to.be.equal(sideProxy.address);
				expect(this.events[this.events.length - 1].returnValues.approved).to.be.equal("1");
			});

			it('can unset approval for an operator', async function () {
				await token.call("setApprovalForAll", [
					sideProxy.address,
					false,
				], {caller: sideMultiTokenHolder});

				expect(await token.query("isApprovedForAll", [sideMultiTokenHolder.address, sideProxy.address])).to.be.deep.equal(["0"]);
			});

			it('reverts if attempting to approve self as an operator', async function () {
				try {
					await token.call("setApprovalForAll", [
						sideMultiTokenHolder.address,
						true,
					], {caller: sideMultiTokenHolder});
					expect.fail()
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});
		});

		describe('safeTransferFrom', function () {
			beforeEach(async function () {
				await token.call("mint", [sideMultiTokenHolder.address, firstTokenId, firstAmount, "0x00"], {caller: sideMinter});
				await token.call("mint", [sideMultiTokenHolder.address, secondTokenId, secondAmount, "0x00"], {caller: sideMinter});
			});

			it('reverts when transferring more than balance', async function () {
				try {
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						firstTokenId,
						(parseInt(firstAmount) + 1).toString(),
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			it('reverts when transferring to zero address', async function () {
				try {
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						ZERO_ADDRESS,
						firstTokenId,
						firstAmount,
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			function transferWasSuccessful ({ operator, from, id, value }: any) {
				it('debits transferred balance from sender', async function () {
					expect(await token.query("balanceOf", [from, id])).to.be.deep.equal(['0']);
				});

				it('credits transferred balance to receiver', async function () {
					expect(await token.query("balanceOf", [this.toWhom, id])).to.be.deep.equal([value]);
				});

				it('emits a TransferSingle log', function () {
					expect(this.event.event).to.be.equal("TransferSingle");
					expect(this.event.returnValues.operator).to.be.equal(operator);
					expect(this.event.returnValues.from).to.be.equal(from);
					expect(this.event.returnValues.to).to.be.equal(this.toWhom);
					expect(this.event.returnValues.id).to.be.equal(id);
					expect(this.event.returnValues.value).to.be.equal(value);
				});
			}

			context('when called by the multiTokenHolder', async function () {
				beforeEach(async function () {
					this.toWhom = sideRecipient.address;

					const height = await token.height();
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						firstTokenId,
						firstAmount,
						"0x00"
					], {caller: sideMultiTokenHolder});
					await token.waitForHeight(height + 1);
					const events = await token.getPastEvents('allEvents', {fromHeight: height});
					this.event = events[events.length - 1];
				});

				transferWasSuccessful.call(this, {
					operator: sideMultiTokenHolder.address,
					from: sideMultiTokenHolder.address,
					id: firstTokenId,
					value: firstAmount,
				});

				it('preserves existing balances which are not transferred by multiTokenHolder', async function () {
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, secondTokenId])).to.be.deep.equal([secondAmount]);
					expect(await token.query("balanceOf", [sideRecipient.address, secondTokenId])).to.be.deep.equal(['0']);
				});
			});

			context('when called by an operator on behalf of the multiTokenHolder', function () {
				context('when operator is not approved by multiTokenHolder', function () {
					beforeEach(async function () {
						await token.call("setApprovalForAll", [sideProxy.address, false], {caller: sideMultiTokenHolder});
					});

					it('reverts', async function () {
						try {
							await token.call("safeTransferFrom", [
								sideMultiTokenHolder.address,
								sideRecipient.address,
								firstTokenId,
								firstAmount,
								"0x00"
							], {caller: sideProxy});
							expect.fail();
						} catch (e: any) {
							expect(e.message).to.include('revert');
						}
					});
				});

				context('when operator is approved by multiTokenHolder', function () {
					beforeEach(async function () {
						this.toWhom = sideRecipient.address;
						await token.call("setApprovalForAll", [
							sideProxy.address,
							true
						], {caller: sideMultiTokenHolder})

						const height = await token.height();
						await token.call("safeTransferFrom", [
							sideMultiTokenHolder.address,
							sideRecipient.address,
							firstTokenId,
							firstAmount,
							"0x00"
						], {caller: sideProxy});
						await token.waitForHeight(height + 1);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					transferWasSuccessful.call(this, {
						operator: sideProxy.address,
						from: sideMultiTokenHolder.address,
						id: firstTokenId,
						value: firstAmount,
					});

					it('preserves operator\'s balances not involved in the transfer', async function () {
						expect(await token.query("balanceOf", [sideProxy.address, firstTokenId])).to.be.deep.equal(['0']);
						expect(await token.query("balanceOf", [sideProxy.address, secondTokenId])).to.be.deep.equal(['0']);
					});
				});
			});

			context('when sending to a valid receiver', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, false, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');
				});

				context('without data', function () {
					beforeEach(async function () {
						this.toWhom = receiver.address;
						const height = await token.height();
						await token.call("safeTransferFrom", [
							sideMultiTokenHolder.address,
							receiver.address,
							firstTokenId,
							firstAmount,
							"0x00",
						], {caller: sideMultiTokenHolder});
						await token.waitForHeight(height + 2);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					transferWasSuccessful.call(this, {
						operator: sideMultiTokenHolder.address,
						from: sideMultiTokenHolder.address,
						id: firstTokenId,
						value: firstAmount,
					});

					it('calls onERC1155Received', async function () {
						const events = await receiver.getPastEvents('allEvents', {fromHeight: 0});
						expect(events[events.length - 1].event).to.be.equal("Received");
						expect(events[events.length - 1].returnValues.operator).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.from).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.id).to.be.equal(firstTokenId);
						expect(events[events.length - 1].returnValues.value).to.be.equal(firstAmount);
						expect(events[events.length - 1].returnValues.data).to.be.equal("00");
					});
				});

				context('with data', function () {
					const data = '0xf00dd00d';
					beforeEach(async function () {
						this.toWhom = receiver.address;
						const height = await token.height();
						await token.call("safeTransferFrom", [
							sideMultiTokenHolder.address,
							receiver.address,
							firstTokenId,
							firstAmount,
							data,
						], {caller: sideMultiTokenHolder})
						await token.waitForHeight(height + 2);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					transferWasSuccessful.call(this, {
						operator: sideMultiTokenHolder.address,
						from: sideMultiTokenHolder.address,
						id: firstTokenId,
						value: firstAmount,
					});

					it('calls onERC1155Received', async function () {
						const events = await receiver.getPastEvents('allEvents', {fromHeight: 0});
						expect(events[events.length - 1].event).to.be.equal("Received");
						expect(events[events.length - 1].returnValues.operator).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.from).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.id).to.be.equal(firstTokenId);
						expect(events[events.length - 1].returnValues.value).to.be.equal(firstAmount);
						expect(events[events.length - 1].returnValues.data).to.be.equal("f00dd00d");
					});
				});
			});

			context('to a receiver contract returning unexpected value', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: ['0x00c0ffee', false, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');
				});

				it('reverts', async function () {
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						receiver.address,
						firstTokenId,
						firstAmount,
						"0x00",
					], {caller: sideMultiTokenHolder});
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount]);
				});
			});

			context('to a receiver contract that reverts', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, true, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');
				});

				it('reverts', async function () {
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						receiver.address,
						firstTokenId,
						firstAmount,
						"0x00",
					], {caller: sideMultiTokenHolder});
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount]);
				});
			});

			context('to a contract that does not implement the required function', function () {
				it('reverts', async function () {
					await token.call("safeTransferFrom", [
						sideMultiTokenHolder.address,
						token.address,
						firstTokenId,
						firstAmount,
						"0x00",
					], {caller: sideMultiTokenHolder});
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount]);
				});
			});
		});

		describe('safeBatchTransferFrom', function () {
			beforeEach(async function () {
				await token.call("mint", [sideMultiTokenHolder.address, firstTokenId, firstAmount, "0x00"], {caller: sideMinter});
				await token.call("mint", [sideMultiTokenHolder.address, secondTokenId, secondAmount, "0x00"], {caller: sideMinter});
			});

			it('reverts when transferring amount more than any of balances', async function () {
				try {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						[firstTokenId, secondTokenId],
						[firstAmount, (parseInt(secondAmount) + 1).toString()],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			it('reverts when ids array length doesn\'t match amounts array length', async function () {
				try {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						[firstTokenId],
						[firstAmount, secondAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}

				try {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						[firstTokenId, secondTokenId],
						[firstAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			it('reverts when transferring to zero address', async function () {
				try {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						ZERO_ADDRESS,
						[firstTokenId, secondTokenId],
						[firstAmount, secondAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect.fail();
				} catch (e: any) {
					expect(e.message).to.include('revert');
				}
			});

			function batchTransferWasSuccessful ({ operator, from, ids, values }: any) {
				it('debits transferred balances from sender', async function () {
					expect(await token.query("balanceOfBatch", [new Array(ids.length).fill(from), ids]))
						.to.be.deep.equal([new Array(ids.length).fill("0")]);
				});

				it('credits transferred balances to receiver', async function () {
					expect(await token.query("balanceOfBatch", [new Array(ids.length).fill(this.toWhom), ids]))
						.to.be.deep.equal([values]);
				});

				it('emits a TransferBatch log', function () {
					expect(this.event.event).to.be.equal("TransferBatch");
					expect(this.event.returnValues.operator).to.be.equal(operator);
					expect(this.event.returnValues.from).to.be.equal(from);
					expect(this.event.returnValues.to).to.be.equal(this.toWhom);
				});
			}

			context('when called by the multiTokenHolder', async function () {
				beforeEach(async function () {
					this.toWhom = sideRecipient.address;
					const height = await token.height();
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						sideRecipient.address,
						[firstTokenId, secondTokenId],
						[firstAmount, secondAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					await token.waitForHeight(height + 1);
					const events = await token.getPastEvents('allEvents', {fromHeight: height});
					this.event = events[events.length - 1];
				});

				batchTransferWasSuccessful.call(this, {
					operator: sideMultiTokenHolder.address,
					from: sideMultiTokenHolder.address,
					ids: [firstTokenId, secondTokenId],
					values: [firstAmount, secondAmount],
				});
			});

			context('when called by an operator on behalf of the multiTokenHolder', function () {
				context('when operator is not approved by multiTokenHolder', function () {
					beforeEach(async function () {
						await token.call("setApprovalForAll", [sideProxy.address, false], {caller: sideMultiTokenHolder});
					});

					it('reverts', async function () {
						try {
							await token.call("safeBatchTransferFrom", [
								sideMultiTokenHolder.address,
								sideRecipient.address,
								[firstTokenId, secondTokenId],
								[firstAmount, secondAmount],
								"0x00",
							], {caller: sideProxy});
							expect.fail();
						} catch (e: any) {
							expect(e.message).to.include('revert');
						}
					});
				});

				context('when operator is approved by multiTokenHolder', function () {
					beforeEach(async function () {
						this.toWhom = sideRecipient.address;
						await token.call("setApprovalForAll", [sideProxy.address, true], {caller: sideMultiTokenHolder});
						const height = await token.height();
						await token.call("safeBatchTransferFrom", [
							sideMultiTokenHolder.address,
							sideRecipient.address,
							[firstTokenId, secondTokenId],
							[firstAmount, secondAmount],
							"0x00",
						], {caller: sideProxy});
						await token.waitForHeight(height + 1);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					batchTransferWasSuccessful.call(this, {
						operator: sideProxy.address,
						from: sideMultiTokenHolder.address,
						ids: [firstTokenId, secondTokenId],
						values: [firstAmount, secondAmount],
					});

					it('preserves operator\'s balances not involved in the transfer', async function () {
						expect(await token.query("balanceOf", [sideProxy.address, firstTokenId])).to.be.deep.equal(['0']);
						expect(await token.query("balanceOf", [sideProxy.address, secondTokenId])).to.be.deep.equal(['0']);
					});
				});
			});

			context('when sending to a valid receiver', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, false, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');
				});

				context('without data', function () {
					beforeEach(async function () {
						this.toWhom = receiver.address;
						const height = await token.height();
						await token.call("safeBatchTransferFrom", [
							sideMultiTokenHolder.address,
							receiver.address,
							[firstTokenId, secondTokenId],
							[firstAmount, secondAmount],
							'0x00',
						], { caller: sideMultiTokenHolder });
						await token.waitForHeight(height + 2);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					batchTransferWasSuccessful.call(this, {
						operator: sideMultiTokenHolder.address,
						from: sideMultiTokenHolder.address,
						ids: [firstTokenId, secondTokenId],
						values: [firstAmount, secondAmount],
					});

					it('calls onERC1155BatchReceived', async function () {
						const events = await receiver.getPastEvents('allEvents', {fromHeight: 0});
						expect(events[events.length - 1].event).to.be.equal("BatchReceived");
						expect(events[events.length - 1].returnValues.operator).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.from).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.data).to.be.equal("00");
					});
				});

				context('with data', function () {
					const data = '0xf00dd00d';
					beforeEach(async function () {
						this.toWhom = receiver.address;
						const height = await token.height();
						await token.call("safeBatchTransferFrom", [
							sideMultiTokenHolder.address,
							receiver.address,
							[firstTokenId, secondTokenId],
							[firstAmount, secondAmount],
							data,
						], { caller: sideMultiTokenHolder });
						await token.waitForHeight(height + 2);
						const events = await token.getPastEvents('allEvents', {fromHeight: height});
						this.event = events[events.length - 1];
					});

					batchTransferWasSuccessful.call(this, {
						operator: sideMultiTokenHolder.address,
						from: sideMultiTokenHolder.address,
						ids: [firstTokenId, secondTokenId],
						values: [firstAmount, secondAmount],
					});

					it('calls onERC1155BatchReceived', async function () {
						const events = await receiver.getPastEvents('allEvents', {fromHeight: 0});
						expect(events[events.length - 1].event).to.be.equal("BatchReceived");
						expect(events[events.length - 1].returnValues.operator).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.from).to.be.equal(sideMultiTokenHolder.address);
						expect(events[events.length - 1].returnValues.data).to.be.equal("f00dd00d");
					});
				});
			});

			context('to a receiver contract returning unexpected value', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, false, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');
				});

				it('reverts', async function () {
					try {
						await token.call("safeBatchTransferFrom", [
							sideMultiTokenHolder.address,
							receiver.address,
							[firstTokenId, secondTokenId],
							[firstAmount, secondAmount],
							'0x',
						], { caller: sideMultiTokenHolder });
						expect.fail();
					} catch (e) {
						expect(e).to.be.an.instanceof(Error);
					}
				});
			});

			context('to a receiver contract that reverts', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, false, RECEIVER_BATCH_MAGIC_VALUE, true]});
					expect(token.address).to.be.a('string');
				});

				it('reverts', async function () {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						receiver.address,
						[firstTokenId, secondTokenId],
						[firstAmount, secondAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount]);
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, secondTokenId])).to.be.deep.equal([secondAmount]);
				});
			});

			context('to a receiver contract that reverts only on single transfers', function () {
				beforeEach(async function () {
					receiver.setDeployer(deployer).setProvider(provider);
					await receiver.deploy({params: [RECEIVER_SINGLE_MAGIC_VALUE, true, RECEIVER_BATCH_MAGIC_VALUE, false]});
					expect(token.address).to.be.a('string');

					this.toWhom = receiver.address;
					const height = await token.height();
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						receiver.address,
						[firstTokenId, secondTokenId],
						[firstAmount, secondAmount],
						"0x00",
					], { caller: sideMultiTokenHolder });
					await token.waitForHeight(height + 2);
					const events = await token.getPastEvents('allEvents', {fromHeight: height});
					this.event = events[events.length - 1];
				});

				batchTransferWasSuccessful.call(this, {
					operator: sideMultiTokenHolder.address,
					from: sideMultiTokenHolder.address,
					ids: [firstTokenId, secondTokenId],
					values: [firstAmount, secondAmount],
				});

				it('calls onERC1155BatchReceived', async function () {
					const events = await receiver.getPastEvents('allEvents', {fromHeight: 0});
					expect(events[events.length - 1].event).to.be.equal("BatchReceived");
					expect(events[events.length - 1].returnValues.operator).to.be.equal(sideMultiTokenHolder.address);
					expect(events[events.length - 1].returnValues.from).to.be.equal(sideMultiTokenHolder.address);
					expect(events[events.length - 1].returnValues.data).to.be.equal("00");
				});
			});

			context('to a contract that does not implement the required function', function () {
				it('reverts', async function () {
					await token.call("safeBatchTransferFrom", [
						sideMultiTokenHolder.address,
						token.address,
						[firstTokenId, secondTokenId],
						[firstAmount, secondAmount],
						"0x00"
					], {caller: sideMultiTokenHolder});
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, firstTokenId])).to.be.deep.equal([firstAmount]);
					expect(await token.query("balanceOf", [sideMultiTokenHolder.address, secondTokenId])).to.be.deep.equal([secondAmount]);
				});
			});
		});

	});

	describe('internal functions', function () {
		const tokenId = "1990";
		const mintAmount = "9001";
		const burnAmount = "3000";

		const tokenBatchIds = ["2000", "2010", "2020"];
		const mintAmounts = ["5000", "10000", "42195"];
		const burnAmounts = ["5000", "9001", "195"];

		const data = '0x12345678';

		describe('_mint', function () {
			it('reverts with a zero destination address', async function () {
				try {
					await token.call("mint", [
						ZERO_ADDRESS,
						tokenId,
						mintAmount,
						data,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			context('with minted tokens', function () {
				beforeEach(async function () {
					const height = await token.height();
					await token.call("mint", [
						tokenHolder.address,
						tokenId,
						mintAmount,
						data,
					], {caller: operator});
					await token.waitForHeight(height + 1);
					this.events = await token.getPastEvents('allEvents', {fromHeight: height});
				});

				it('emits a TransferSingle event', async function () {
					expect(this.events[0].event).to.be.equal("TransferSingle");
					expect(this.events[0].returnValues.operator).to.be.equal(operator.address);
					expect(this.events[0].returnValues.from).to.be.equal(ZERO_ADDRESS);
					expect(this.events[0].returnValues.to).to.be.equal(tokenHolder.address);
					expect(this.events[0].returnValues.id).to.be.equal(tokenId);
					expect(this.events[0].returnValues.value).to.be.equal(mintAmount);
				});

				it('credits the minted amount of tokens', async function () {
					expect(await token.query('balanceOf', [tokenHolder.address, tokenId]))
						.to.be.deep.equal([mintAmount]);
				});
			});
		});

		describe('_mintBatch', function () {
			it('reverts with a zero destination address', async function () {
				try {
					await token.call("mintBatch", [
						ZERO_ADDRESS,
						tokenBatchIds,
						mintAmounts,
						data,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			it('reverts if length of inputs do not match', async function () {
				try {
					await token.call("mintBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						mintAmounts.slice(1),
						data,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}

				try {
					await token.call("mintBatch", [
						tokenBatchHolder.address,
						tokenBatchIds.slice(1),
						mintAmounts,
						data,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			context('with minted batch of tokens', function () {
				beforeEach(async function () {
					const height = await token.height();
					await token.call("mintBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						mintAmounts,
						data,
					], {caller: operator});
					await token.waitForHeight(height + 1);
					this.events = await token.getPastEvents('allEvents', {fromHeight: height});
				});

				it('emits a TransferBatch event', function () {
					expect(this.events[0].event).to.be.equal("TransferBatch");
					expect(this.events[0].returnValues.operator).to.be.equal(operator.address);
					expect(this.events[0].returnValues.from).to.be.equal(ZERO_ADDRESS);
					expect(this.events[0].returnValues.to).to.be.equal(tokenBatchHolder.address);
				});

				it('credits the minted batch of tokens', async function () {
					const holderBatchBalances = await token.query('balanceOfBatch',
						  [new Array(tokenBatchIds.length).fill(tokenBatchHolder.address),
						  tokenBatchIds
						]);
					expect(holderBatchBalances).to.be.deep.equal([mintAmounts]);
				});
			});
		});

		describe('_burn', function () {
			it('reverts when burning the zero account\'s tokens', async function () {
				try {
					await token.call("burn", [
						ZERO_ADDRESS,
						tokenId,
						mintAmount,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			it('reverts when burning a non-existent token id', async function () {
				try {
					await token.call("burn", [
						tokenHolder.address,
						tokenId,
						mintAmount,
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			it('reverts when burning more than available tokens', async function () {
				await token.call("mint", [
					tokenHolder.address,
					tokenId,
					mintAmount,
					data,
				], { caller: deployer});

				try {
					await token.call("burn", [
						tokenHolder.address,
						tokenId,
						(parseInt(mintAmount) + 1).toString(),
					], { caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			context('with minted-then-burnt tokens', function () {
				beforeEach(async function () {
					await token.call("mint", [
						tokenHolder.address,
						tokenId,
						mintAmount,
						data,
					], { caller: deployer});

					const height = await token.height();
					await token.call("burn", [
						tokenHolder.address,
						tokenId,
						burnAmount,
					], {caller: operator});
					await token.waitForHeight(height + 1);
					this.events = await token.getPastEvents('allEvents', {fromHeight: height});
				});

				it('emits a TransferSingle event', function () {
					expect(this.events[this.events.length - 1].event).to.be.equal("TransferSingle");
					expect(this.events[this.events.length - 1].returnValues.operator).to.be.equal(operator.address);
					expect(this.events[this.events.length - 1].returnValues.from).to.be.equal(tokenHolder.address);
					expect(this.events[this.events.length - 1].returnValues.to).to.be.equal(ZERO_ADDRESS);
					expect(this.events[this.events.length - 1].returnValues.id).to.be.equal(tokenId);
					expect(this.events[this.events.length - 1].returnValues.value).to.be.equal(burnAmount);
				});

				it('accounts for both minting and burning', async function () {
					expect(await token.query('balanceOf', [tokenHolder.address, tokenId]))
						.to.be.deep.equal([(parseInt(mintAmount) - parseInt(burnAmount)).toString()]);
				});
			});
		});

		describe('_burnBatch', function () {
			it('reverts when burning the zero account\'s tokens', async function () {
				try {
					await token.call("burnBatch", [
						ZERO_ADDRESS,
						tokenBatchIds,
						burnAmounts
					], {caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			it('reverts if length of inputs do not match', async function () {
				try {
					await token.call("burnBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						burnAmounts.slice(1),
					], {caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}

				try {
					await token.call("burnBatch", [
						tokenBatchHolder.address,
						tokenBatchIds.slice(1),
						burnAmounts,
					], {caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			it('reverts when burning a non-existent token id', async function () {
				try {
					await token.call("burnBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						burnAmounts,
					], {caller: deployer});
					expect(false);
				} catch (e: any) {
					expect(e.message).to.include('revert');;
				}
			});

			context('with minted-then-burnt tokens', function () {
				beforeEach(async function () {
					await token.call("mintBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						mintAmounts,
						data,
					], {caller: deployer});

					const height = await token.height();
					await token.call("burnBatch", [
						tokenBatchHolder.address,
						tokenBatchIds,
						burnAmounts,
					], {caller: operator});
					await token.waitForHeight(height + 1);
					this.events = await token.getPastEvents('allEvents', {fromHeight: height});
				});

				it('emits a TransferBatch event', function () {
					expect(this.events[this.events.length - 1].event).to.be.equal("TransferBatch");
					expect(this.events[this.events.length - 1].returnValues.operator).to.be.equal(operator.address);
					expect(this.events[this.events.length - 1].returnValues.from).to.be.equal(tokenBatchHolder.address);
					expect(this.events[this.events.length - 1].returnValues.to).to.be.equal(ZERO_ADDRESS);
				});

				it('accounts for both minting and burning', async function () {
					const holderBatchBalances = await token.query('balanceOfBatch',
						  [new Array(tokenBatchIds.length).fill(tokenBatchHolder.address),
						  tokenBatchIds
						]);
					let expectedAmounts = [];
					for (let i = 0; i < mintAmounts.length; i++) {
						expectedAmounts.push((parseInt(mintAmounts[i]) - parseInt(burnAmounts[i])).toString());
					}
					expect(holderBatchBalances).to.be.deep.equal([expectedAmounts]);
				});
			});
		});
	});

	describe('ERC1155MetadataURI', function () {
		const firstTokenID = '42';
		const secondTokenID = '1337';

		it('emits no URI event in constructor', async function () {
			const events = await token.getPastEvents('allEvents', {fromHeight: 0});
			let hasURIEvent = false;
			for (const event of events) {
				if (event.event == "URI") {
					hasURIEvent = true
				}
			}

			expect(!hasURIEvent);
		});

		it('sets the initial URI for all token types', async function () {
			expect(await token.query("uri", [firstTokenID])).to.be.deep.equal([initialURI]);
			expect(await token.query("uri", [secondTokenID])).to.be.deep.equal([initialURI]);
		});

		describe('_setURI', function () {
			const newURI = 'https://token-cdn-domain/{locale}/{id}.json';

			it('emits no URI event', async function () {
				const height = await token.height();
				await token.call("setURI", [
					newURI
				], {caller: deployer});
				await token.waitForHeight(height + 1);
				const events = await token.getPastEvents('allEvents', {fromHeight: height});

				let hasURIEvent = false;
				for (const event of events) {
					if (event.event == "URI") {
						hasURIEvent = true
					}
				}

				expect(!hasURIEvent);
			});

			it('sets the new URI for all token types', async function () {
				await token.call("setURI", [
					newURI
				], {caller: deployer});

				expect(await token.query("uri", [firstTokenID])).to.be.deep.equal([newURI]);
				expect(await token.query("uri", [secondTokenID])).to.be.deep.equal([newURI]);
			});
		});
	});
});