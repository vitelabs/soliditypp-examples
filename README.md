# soliditypp-examples
Examples of Solidity++ 0.8.1.

This is a preview version. DO NOT use it in production environment.
# Getting Started
```
npm install
npm test
```
# Test Environments
## Test on Release Environment
Contracts are compiled by the release version of solppc and deployed on local network running the release version of gvite.
```
npm run test-on-release
```

## Test on Beta Environment
Contracts are compiled by the beta version of solppc and deployed on local network running the beta version of gvite.

Beta version means gvite is deployed on testnet but not deployed on mainnet yet.
```
npm run test-on-beta
```

## Test on Nightly Environment
Contracts are compiled by the nightly version of solppc and deployed on local network running the nightly version of gvite.

Nightly version is the developing build of solppc and gvite.
```
npm run test-on-nightly
```