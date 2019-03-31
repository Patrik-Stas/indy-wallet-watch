import indy from "indy-sdk";
import fs from "fs";
import {createWalletClient} from "./client";
import _ from 'lodash';
const homedir = require('os').homedir();

export function getWalletDirectory() {
  return `${homedir}/.indy_client/wallet/`
}

export async function listWallets() {
  const walletDirectory = getWalletDirectory();
  const walletNames = fs.readdirSync(walletDirectory);
  return walletNames
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
    return {name, key}
  });
  const results = await Promise.all(resultPromises);
  const selected = _.keyBy(results, 'name');
  const discovered = _.pickBy(selected, o=>!!o.key);
  const unknown = _.pickBy(selected, o=>!o.key);
  return {discovered, unknown}
}