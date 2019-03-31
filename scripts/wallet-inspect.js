import {createWalletClient} from "../lib/client";
import {findKeysForWallets, listWallets} from "../lib/indy-utils";
import {didsToTableString, pairwiseToTableString} from "../lib/client-utils";
import _ from 'lodash';
import Promise from "bluebird";

async function determineTargetWallets() {
  if (!!process.env.WALLET) {
    return [process.env.WALLET]
  } else {
    return await listWallets();
  }
}

async function determineKeyDictionary() {
  const defaultDictionary = ['123', 'key'];
  if (!!process.env.KEY) {
    const passedKeys = process.env.KEY.split(',')
    return _.uniq([ ... defaultDictionary, ...passedKeys])
  } else {
    return defaultDictionary
  }
}

async function enrichByDetails(walletDetail) {
  const {name, key} = walletDetail;
  const walletClient = await createWalletClient(name, key);
  const didRecords = await walletClient.listMyDidsWithMeta();
  const pairwiseRecords = await walletClient.listPairwise();
  return {...walletDetail, didRecords, pairwiseRecords}
}


function printTablesOverview(walletDetail) {
  const {didRecords, pairwiseRecords, name, key} = walletDetail;
  const tableDids = didsToTableString(didRecords);
  const tablePairwises = pairwiseToTableString(pairwiseRecords);
  console.log(`-------------------------------- '${name}--------------------------------'`);
  console.log(`Key: '${key}'`);
  console.log(`DID table:`);
  console.log(tableDids);
  if (!!tablePairwises) {
    console.log(`Pairwise DID table:`);
    console.log(tablePairwises)
  }
}

async function run() {
  const targetWallets = await determineTargetWallets();
  const keyDictionary = await determineKeyDictionary();
  console.log(`Target wallets:`);
  console.log(JSON.stringify(targetWallets));
  console.log(`Key dictionary:`);
  console.log(JSON.stringify(keyDictionary));
  const {discovered, unknown} = await findKeysForWallets(targetWallets, keyDictionary);
  const enriched = await Promise.props(_.mapValues(discovered, async (o) => await enrichByDetails(o)));
  for (const name of Object.keys(enriched)) {
    await printTablesOverview(enriched[name])
  }
  console.log(`----------------------------------------Couldn't open wallets--------------------------------------------------`);
  const unknownWallets = _.map(unknown, o => o.name);
  console.log(JSON.stringify(unknownWallets))
  console.log(`---------------------------------------------------------------------------------------------------------------`);
}

run();