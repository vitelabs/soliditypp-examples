import * as vite from "../src/vite";
import * as config from "./vite.config.json"

export async function mochaGlobalSetup() {
    await vite.startLocalNetwork('nightly');
    console.log(`Test environment is ready.`);
}
export const mochaGlobalTeardown = async () => {
    await vite.stopLocalNetwork();
    console.log('Test environment cleared.');
  };