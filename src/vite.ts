import { ViteAPI, wallet} from "@vite/vitejs";
import { UserAccount } from "./user";
const { HTTP_RPC } = require("@vite/vitejs-http");
const { WS_RPC } = require("@vite/vitejs-ws");
const { IPC_RPC } = require("@vite/vitejs-ipc");
import {exec, execSync } from 'child_process';
import * as utils from "./utils";
import config from "./vite.config.json";

let process: any;
let provider: any;
let nodeConfig: any;

export async function startLocalNetwork(node: string = 'nightly') {
  console.log('[Vite] Starting Vite local network...');
  nodeConfig = (config.nodes as any)[node];
  console.log('Node binanry:', nodeConfig.name);
  process = exec(
    `./restart.sh ${nodeConfig.name}`,
      {
          cwd: 'bin/'
      },
      (error, stdout, stderr) => {
        // if(error) console.error(error);
        // console.log(stdout);
      }
  );
  console.log('[Vite] Waiting for the local network to go live...');

  await waitNetworkUp();
  console.log('[Vite] Vite local network is live!');
}

export async function stopLocalNetwork() {
  console.log('[Vite] Stopping Vite local network...');
  // process.kill('SIGKILL');
  exec(
    `./shutdown.sh`,
      {
          cwd: 'bin/'
      },
      (error, stdout, stderr) => {
        // if(error) console.error(error);
      }
  );
}

async function waitNetworkUp() {
  await utils.waitFor(isNetworkUp, 'Wait for local network', 1000);
}

async function isNetworkUp() {
  let h = await localProvider().request('ledger_getSnapshotChainHeight');
  return h && (h > 0);
}

export function localProvider() {
  if (!provider) {
    if (!nodeConfig)
      nodeConfig = config.nodes.nightly;
    provider = newProvider(nodeConfig.http);
  }
  
  return provider;
}

export function newProvider(url: string) {
  // const ipcProvider = new ViteAPI(new IPC_RPC("~/code/contracts/bin/ledger/devdata/gvite.ipc", 10000), () => {
  //     console.log("New Vite provider from", url);
  //   });
  const httpProvider = new ViteAPI(new HTTP_RPC(url), () => {
    console.log("New Vite provider from", url);
  });
  return httpProvider;
}

export function newAccount(mnemonics: string, index: number) {
  const addressObj = wallet.getWallet(mnemonics).deriveAddress(index);
  let a = new UserAccount(addressObj.address);
  a.setPrivateKey(addressObj.privateKey);
  a._setProvider(provider);
  return a;
}

export async function mint(provider: any) {
  // await sleep(1000);
  // return await provider.request("miner_mine");
}

export async function getSnapshotHeight(provider: any) {
  return provider.request("ledger_getSnapshotChainHeight");
}

export async function getAccountHeight(provider: any, to: string): Promise<Number> {
  return provider
    .request("ledger_getLatestAccountBlock", to)
    .then((block: any) => {
      if (block) {
        return parseInt(block.height);
      } else {
        return 0;
      }
    });
}

export async function getQuota(provider: any, to: string) {
  return provider.request("contract_getQuotaByAccount", to);
}

export async function getAccountBlock(provider: any, hash?: string) {
  return provider.request("ledger_getAccountBlockByHash", hash);
}

export async function getBalance(provider: any, address: string, tokenId: string = 'tti_5649544520544f4b454e6e40') {
  const result = await provider.getBalanceInfo(address);
  const balance = result.balance.balanceInfoMap[tokenId].balance;
  return balance;
}

export async function isReceived(provider: any, hash?: string) {
  return getAccountBlock(provider, hash).then((block) => {
    if (!block) {
      return false;
    } else {
      if (!block.receiveBlockHash) {
        return false;
      } else {
        return true;
      }
    }
  });
}

export async function isConfirmed(provider: any, hash?: string) {
  const block = await getAccountBlock(provider, hash);
  if (!block) {
    return false;
  } else {
    if (!block.confirmedHash) {
      return false;
    } else {
      return true;
    }
  }
}
