import {createWalletClient} from "../src/indy-wallet-client";
import {findKeysForWallets, listWallets} from "../src/indytools";
import _ from 'lodash';

const keyDictionary = ['123', 'key', 'foo' ];

async function run() {
  const {discovered, unknown} = await findKeysForWallets(await listWallets(), keyDictionary);
  const wallets = await Promise.all(_.map(discovered, async rec => {
    const {name, key} = rec;
    const wallet = await createWalletClient(name, key);
    const didTable = await wallet.didsToTableString();
    const pairwiseTable = await wallet.pairwiseToTableString();
    return {didTable, pairwiseTable, name, key};
  }));
  for (const {didTable, pairwiseTable , name, key} of wallets) {

    console.log(`---------------------------------------------------------------------------------------------------------------`);
    console.log(`----------------------- '${name}' ----------------------- (key ='${key}')`);
    console.log(`DID table:`);
    console.log(didTable);
    if (!!pairwiseTable) {
      console.log(`Pairwise DID table:`);
      console.log(pairwiseTable)
    }
  }

  console.log(`---------------------------------------------------------------------------------------------------------------`);
  console.log(`-------------------------------Couldn't open wallets--------------------------------------------------`);
  const unknownWallets = _.map(unknown, o => o.name);
  console.log(JSON.stringify(unknownWallets))
  console.log(`---------------------------------------------------------------------------------------------------------------`);
}

run();