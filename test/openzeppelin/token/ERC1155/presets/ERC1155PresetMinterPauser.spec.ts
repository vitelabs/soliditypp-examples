import {beforeEach, describe} from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "../../../../vite.config.json";


let provider: any;
let deployer: any;
let other: any;
let token: any;
const firstTokenId = '845';
const firstTokenIdAmount = '5000';

const secondTokenId = '48324';
const secondTokenIdAmount = '77875';

const DEFAULT_ADMIN_ROLE = '0000000000000000000000000000000000000000000000000000000000000000';
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'; // MINTER_ROLE
const PAUSER_ROLE = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'; // PAUSER_ROLE

const ZERO_ADDRESS = "vite_0000000000000000000000000000000000000000a4f3a0cb58"

const uri = 'https://token.com';

describe('test OpenZeppelin ERC1155PresetMinterPauser', () => {
	before(async function() {
		provider = vite.newProvider("http://127.0.0.1:23456");
		deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);
		other = vite.newAccount(config.networks.local.mnemonic, 1, provider);
		// compile
		const compiledERC1155PresetMinterPauserContracts = await vite.compile('openzeppelin/token/ERC1155/presets/ERC1155PresetMinterPauser.sol');
		expect(compiledERC1155PresetMinterPauserContracts).to.have.property('ERC1155PresetMinterPauser');
		token = compiledERC1155PresetMinterPauserContracts.ERC1155PresetMinterPauser;
	});

	beforeEach(async function() {
		await deployer.sendToken(other.address, '500');
		await other.receiveAll();
		// build
		token.setDeployer(deployer).setProvider(provider);
		await token.deploy({params: [uri]});
		expect(token.address).to.be.a('string');
	});

	it('deployer has the default admin role', async function () {
		expect(await token.query("getRoleMemberCount", [DEFAULT_ADMIN_ROLE])).to.be.deep.equal(['1']);
		expect(await token.query("getRoleMember", [DEFAULT_ADMIN_ROLE, 0])).to.be.deep.equal([deployer.address]);
	});

	it('deployer has the minter role', async function () {
		expect(await token.query("getRoleMemberCount", [MINTER_ROLE])).to.be.deep.equal(['1']);
		expect(await token.query("getRoleMember", [MINTER_ROLE, 0])).to.be.deep.equal([deployer.address]);
	});

	it('deployer has the pauser role', async function () {
		expect(await token.query("getRoleMemberCount", [PAUSER_ROLE])).to.be.deep.equal(['1']);
		expect(await token.query("getRoleMember", [PAUSER_ROLE, 0])).to.be.deep.equal([deployer.address]);
	});

	it('minter and pauser role admin is the default admin', async function () {
		expect(await token.query("getRoleAdmin", [MINTER_ROLE])).to.be.deep.equal([DEFAULT_ADMIN_ROLE]);
		expect(await token.query("getRoleAdmin", [PAUSER_ROLE])).to.be.deep.equal([DEFAULT_ADMIN_ROLE]);
	});

	describe('minting', function () {
		it('deployer can mint tokens', async function () {
			const height = await token.height();
			await token.call("mint", [
				other.address,
				firstTokenId,
				firstTokenIdAmount,
				"0x00"
			], { caller: deployer });
			await token.waitForHeight(height + 1);
			const events = await token.getPastEvents('allEvents', {fromHeight: height});
			expect(events[events.length - 1].event).to.be.equal('TransferSingle');
			expect(events[events.length - 1].returnValues.operator).to.be.equal(deployer.address);
			expect(events[events.length - 1].returnValues.from).to.be.equal(ZERO_ADDRESS);
			expect(events[events.length - 1].returnValues.to).to.be.equal(other.address);
			expect(events[events.length - 1].returnValues.value).to.be.equal(firstTokenIdAmount);
			expect(events[events.length - 1].returnValues.id).to.be.equal(firstTokenId);

			expect(await token.query("balanceOf", [other.address, firstTokenId])).to.be.deep.equal([firstTokenIdAmount]);
		});

		it('other accounts cannot mint tokens', async function () {
			try {
				await token.call("mint", [
					other.address,
					firstTokenId,
					firstTokenIdAmount,
					"0x00",
				], {caller: other});
				expect.fail();
			} catch (e: any) {
				expect(e.message).to.include('revert');
			}
		});
	});

	describe('batched minting', function () {
		it('deployer can batch mint tokens', async function () {
			const height = await token.height();
			await token.call("mintBatch", [
				other.address,
				[firstTokenId, secondTokenId],
				[firstTokenIdAmount, secondTokenIdAmount],
				"0x00"
			], { caller: deployer });
			await token.waitForHeight(height + 1);
			const events = await token.getPastEvents('allEvents', {fromHeight: height});
			expect(events[events.length - 1].event).to.be.equal('TransferBatch');
			expect(events[events.length - 1].returnValues.operator).to.be.equal(deployer.address);
			expect(events[events.length - 1].returnValues.from).to.be.equal(ZERO_ADDRESS);
			expect(events[events.length - 1].returnValues.to).to.be.equal(other.address);

			expect(await token.query("balanceOf", [other.address, firstTokenId])).to.be.deep.equal([firstTokenIdAmount]);
		});

		it('other accounts cannot batch mint tokens', async function () {
			try {
				await token.call("mintBatch", [
					other.address,
					[firstTokenId, secondTokenId],
					[firstTokenIdAmount, secondTokenIdAmount],
					"0x00",
				], {caller: other});
				expect.fail();
			} catch (e: any) {
				expect(e.message).to.include('revert');
			}
		});
	});

	describe('pausing', function () {
		it('deployer can pause', async function () {
			const height = await token.height();
			await token.call("pause", [], { caller: deployer });
			await token.waitForHeight(height + 1);
			const events = await token.getPastEvents('allEvents', {fromHeight: height});
			expect(events[events.length - 1].event).to.be.equal('Paused');
			expect(events[events.length - 1].returnValues.account).to.be.equal(deployer.address);

			expect(await token.query("paused", [])).to.be.deep.equal(["1"]);
		});

		it('deployer can unpause', async function () {
			await token.call("pause", [], { caller: deployer });

			const height = await token.height();
			await token.call("unpause", [], { caller: deployer });
			await token.waitForHeight(height + 1);
			const events = await token.getPastEvents('allEvents', {fromHeight: height});
			expect(events[events.length - 1].event).to.be.equal('Unpaused');
			expect(events[events.length - 1].returnValues.account).to.be.equal(deployer.address);

			expect(await token.query("paused", [])).to.be.deep.equal(["0"]);
		});

		it('cannot mint while paused', async function () {
			await token.call("pause", [], { caller: deployer });

			try {
				await token.call("mint", [
					other.address,
					firstTokenId,
					secondTokenIdAmount,
					"0x00",
				], {caller: other});
				expect.fail();
			} catch (e: any) {
				expect(e.message).to.include('revert');
			}
		});

		it('other accounts cannot pause', async function () {
			try {
				await token.call("pause", [], { caller: other });
				expect.fail();
			} catch (e: any) {
				expect(e.message).to.include('revert');
			}
		});

		it('other accounts cannot unpause', async function () {
			await token.call("pause", [], { caller: deployer });

			try {
				await token.call("unpause", [], { caller: other });
				expect.fail();
			} catch (e: any) {
				expect(e.message).to.include('revert');
			}
		});
	});

	describe('burning', function () {
		it('holders can burn their tokens', async function () {
			await token.call("mint", [
				other.address,
				firstTokenId,
				firstTokenIdAmount,
				"0x00",
			], {caller: deployer});

			const height = await token.height();
			await token.call("burn", [
				other.address,
				firstTokenId,
				(parseInt(firstTokenIdAmount) - 1).toString(),
			], { caller: other });
			await token.waitForHeight(height + 1);
			const events = await token.getPastEvents('allEvents', {fromHeight: height});
			expect(events[events.length - 1].event).to.be.equal('TransferSingle');
			expect(events[events.length - 1].returnValues.operator).to.be.equal(other.address);
			expect(events[events.length - 1].returnValues.from).to.be.equal(other.address);
			expect(events[events.length - 1].returnValues.to).to.be.equal(ZERO_ADDRESS);
			expect(events[events.length - 1].returnValues.value).to.be.equal((parseInt(firstTokenIdAmount) - 1).toString());
			expect(events[events.length - 1].returnValues.id).to.be.equal(firstTokenId);

			expect(await token.query("balanceOf", [other.address, firstTokenId])).to.be.deep.equal(["1"]);
		});
	});

});