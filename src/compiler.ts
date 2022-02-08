import * as fs from "fs";
import {Contract} from "./contract"

var solppc = require('@vite/solppc');

const contractBase = './contracts';

export async function compile(sourcePath: string) {
  let content = readSourceFile(sourcePath);

  const input = {
      language: 'Solidity',
      sources: {
        [sourcePath]: {content: content}
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['evm.bytecode', 'abi']
          }
        }
      }
    };

    let output = JSON.parse(solppc.compile(JSON.stringify(input), { import: findImports }));
    // ignore 3805 warning (pre-release compiler)
    const filteredErrors = output.errors?.filter((err: any) => {return err.errorCode !== '3805'});
    if (filteredErrors && filteredErrors.length > 0) {
      console.error('Compile errors:', filteredErrors);
    }
    let contracts = output.contracts[sourcePath];
    let compiledContracts: any = {};

    for (var contractName in contracts) {
      let code = contracts[contractName].evm.bytecode.object;
      let abi = contracts[contractName].abi;

      compiledContracts[contractName] = new Contract(contractName, code, abi);
    }

    return compiledContracts;
}

function readSourceFile(sourceName: string) {
  let content = fs.readFileSync(`${contractBase}/${sourceName}`).toString();
  // console.log('Compile source file:', sourceName);
  return content;
}

function findImports(path: string) {
  // console.log('Find imports:', path);
  if (fs.existsSync(`${contractBase}/${path}`))
      return {
          contents: readSourceFile(path) 
      };
  else return { error: 'File not found' };
}



