import indy from "indy-sdk";
import fs from "fs";
import {createWalletClient} from "./indy-wallet-client";
import _ from 'lodash';
const homedir = require('os').homedir();

export function getWalletDirectory() {
  return `${homedir}/.indy_client/wallet/`
}

export async function connectToPool(poolName) {
  indy.setProtocolVersion(2);
  console.log(`Connecting to ${poolName}`);
  const poolHandle = await indy.openPoolLedger(poolName);
  console.log('Connected.');
  return poolHandle
}

export async function listWallets() {
  const walletDirectory = getWalletDirectory();
  const walletNames = fs.readdirSync(walletDirectory);
  return walletNames
}

export async function createAndStoreMyDid(wh, seed, metadata) {
  console.log(`Creating new did from seed ${seed}`);
  const res = await indy.createAndStoreMyDid(wh, {seed});
  const did = res[0];
  const vkey = res[1];
  await indy.setDidMetadata(wh, did, metadata);
  console.log(`Created did/verkey '${JSON.stringify(res)}' from seed '${seed}'`);
  return {did, vkey};
}


export async function findKeyForWallet(walletName, testKeys) {
  for (let i=0; i<testKeys.length; i++) {
    const testkey = testKeys[i];
    const wallet = await createWalletClient(walletName, testkey);
    let threw = false;
    try {
      await wallet.listMyDidsWithMeta()
    } catch (err) {
      threw=true;
    }
    if (!threw) {
      return testkey
    }
  }
  return undefined;
}

export async function findKeysForWallets(walletNames, tryKeys) {
  const resultPromises = walletNames.map(async name => {
    const key = await findKeyForWallet(name, tryKeys);
    // console.log(`Discovered key '${key}' for wallet '${wallet}'.`);
    return {name, key}
  });
  const results = await Promise.all(resultPromises);
  const grouped = _.groupBy(results, o => (o.key !== undefined) ? 'discovered' : 'unknown');
  return grouped
}
