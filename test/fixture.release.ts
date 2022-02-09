const vite = require('@vite/vuilder');
import nodeCfg from "./vite.node.json";

vite.loadViteConfig(nodeCfg);

export async function mochaGlobalSetup() {
    await vite.startLocalNetwork('release');
    console.log(`Test environment is ready.`);
}
export const mochaGlobalTeardown = async () => {
    await vite.stopLocalNetwork();
    console.log('Test environment cleared.');
  };