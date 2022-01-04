import { Account } from "@vite/vitejs-accountblock";
import * as utils from "./utils";
import * as vite from "./vite";

export class UserAccount extends Account {
    _provider: any;

    // @todo: hack the private member provider in the base class
    _setProvider(provider: any) {
        this._provider = provider;
        this.setProvider(provider);
    }

    async balance(tokenId: string = 'tti_5649544520544f4b454e6e40'): Promise<string> {
        const result = await this._provider.getBalanceInfo(this.address);
        return result?.balance?.balanceInfoMap?.[tokenId]?.balance || '0';
    }

    async sendToken(toAddress: string, amount: string, tokenId: string = 'tti_5649544520544f4b454e6e40', data: string = '') {
        const block = this.send({ toAddress: toAddress, tokenId: tokenId, amount: amount, data: data});
        await block.autoSend();
        await utils.waitFor(() => {
            return vite.isConfirmed(this._provider, block.hash);
        }, "Wait for send transaction to be confirmed", 1000);
        return block;
    }

    async receiveAll() {
        const blocks = await this._provider.request(
            "ledger_getUnreceivedBlocksByAddress",
            this.address,
            0,
            100
        );
        if (blocks) {
            for (const block of blocks) {
                // console.log('receive', block.hash);
                const receiveBlock = await this.receive({sendBlockHash: block.hash}).autoSend();
                await utils.waitFor(() => {
                    return vite.isConfirmed(this._provider, receiveBlock.hash);
                }, "Wait for receive transaction to be confirmed", 1000);
            }
        }
    }

}