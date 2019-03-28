import {createWalletClient} from "../src/indy-wallet-client";
import {findKeysForWallets, listWallets} from "../src/indytools";
import _ from 'lodash';

const keyDictionary = ['123', 'key', 'foo' ];

async function run() {
  const {discovered, unknown} = await findKeysForWallets(await listWallets(), keyDictionary);
  const wallets = await Promise.all(_.map(discovered, async rec => {
    const {name, key} = rec;
    const wallet = await createWalletClient(name, key);
    const table = await wallet.toTableString();
    return {table, name, key};
  }));
  for (const {table, name, key} of wallets) {
    console.log(`Wallet '${name}' is using key '${key}' and contains:`);
    console.log(table)
  }
  const unknownWallets = _.map(unknown, o => o.name);
  for (const name of unknownWallets) {
    console.log(`Wallet '${name}' key is unknown.`)
  }
}

run();